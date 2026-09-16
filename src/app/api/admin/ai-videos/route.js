import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/PostStatus";
import TextToVideo from "@/models/TextToVideo";
import AiAvatarVideo from "@/models/AiAvatarVideo";
import CgiVideo from "@/models/CgiVideo";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";
const PAGE_SIZE = 24;
const MAX_MATCHED_USERS = 1000;

/** superAdmin only — this lists every user's AI video generations. */
function requireSuperAdmin(req) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    if (decoded?.role !== "superAdmin") {
      return NextResponse.json({ success: false, error: "superAdmin only" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * Every AI video format, mapped to one row shape.
 *
 * Image To Video is read from Posts, not the ImageToVideo collection: most of those
 * videos were made from /post-management (image → video on a post, or the AI
 * "convert to video" action) and only ever live on the Post's `videoOutput`.
 * Posts that the Text/Avatar/CGI pages created for publishing are excluded here so
 * they aren't counted twice.
 */
const SOURCES = {
  image: {
    label: "Image To Video",
    model: Post,
    baseQuery: {
      promat: { $nin: ["Text to Video", "AI Avatar Video", "CGI Product Video"] },
      $or: [
        { videoOutput: { $nin: ["", null] } },
        { mediaType: "video", promat: "Image to Video" },
      ],
    },
    searchFields: ["description", "videoPrompt"],
    projection: "userId videoOutput aiOutput description videoPrompt status createdAt",
    map: (d) => ({
      videoUrl: d.videoOutput || d.aiOutput || "",
      title: (d.description || "Image to Video").slice(0, 120),
      prompt: d.videoPrompt || "",
      cost: 200,
      durationSeconds: null,
      postStatus: d.status || null,
    }),
  },
  text: {
    label: "Text To Video",
    model: TextToVideo,
    baseQuery: {},
    searchFields: ["businessName", "content"],
    projection: "userId videoUrl businessName content finalScript language durationSeconds cost postId createdAt",
    map: (d) => ({
      videoUrl: d.videoUrl,
      title: d.businessName || "Text to Video",
      prompt: d.finalScript || d.content || "",
      cost: d.cost ?? 300,
      durationSeconds: d.durationSeconds ?? null,
      language: d.language || null,
    }),
  },
  avatar: {
    label: "AI Avatar Video",
    model: AiAvatarVideo,
    baseQuery: {},
    searchFields: ["characterName", "script"],
    projection: "userId videoUrl mode characterName script language durationSeconds cost postId createdAt",
    map: (d) => ({
      videoUrl: d.videoUrl,
      title: d.mode === "photo" ? "Uploaded Photo" : d.characterName || "Avatar",
      prompt: d.script || "",
      cost: d.cost ?? null,
      durationSeconds: d.durationSeconds ?? null,
      language: d.language || null,
    }),
  },
  cgi: {
    label: "CGI Product Video",
    model: CgiVideo,
    baseQuery: {},
    searchFields: ["businessName", "productName", "keywords"],
    projection: "userId videoUrl businessName productName keywords adCopy durationSeconds cost postId createdAt",
    map: (d) => ({
      videoUrl: d.videoUrl,
      title: d.productName ? `${d.businessName} — ${d.productName}` : d.businessName || "CGI ad",
      prompt: d.adCopy?.headline || d.keywords || "",
      cost: d.cost ?? 300,
      durationSeconds: d.durationSeconds ?? 10,
    }),
  },
};

/** Base query + optional search (by user OR by the video's own text). */
function buildQuery(source, search, matchedUserIds) {
  if (!search) return source.baseQuery;
  const rx = new RegExp(escapeRegex(search), "i");
  const or = [
    { userId: { $in: matchedUserIds } },
    { userId: rx },
    ...source.searchFields.map((f) => ({ [f]: rx })),
  ];
  return Object.keys(source.baseQuery).length ? { $and: [source.baseQuery, { $or: or }] } : { $or: or };
}

// -----------------------------
// GET /api/admin/ai-videos?type=all|image|text|avatar|cgi&search=&page=1
// -----------------------------
export async function GET(req) {
  const denied = requireSuperAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

    const typeKeys = type === "all" ? Object.keys(SOURCES) : SOURCES[type] ? [type] : null;
    if (!typeKeys) {
      return NextResponse.json({ success: false, error: "Unknown type." }, { status: 400 });
    }

    // Search matches the creator (name / email / phone) as well as the video itself.
    let matchedUserIds = [];
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const users = await User.find({ $or: [{ fullName: rx }, { email: rx }, { phone: rx }, { userId: rx }] })
        .select("userId")
        .limit(MAX_MATCHED_USERS)
        .lean();
      matchedUserIds = users.map((u) => u.userId).filter(Boolean);
    }

    // Counts for every tab (with the current search), so the tabs stay informative.
    const countEntries = await Promise.all(
      Object.entries(SOURCES).map(async ([key, src]) => [
        key,
        await src.model.countDocuments(buildQuery(src, search, matchedUserIds)),
      ])
    );
    const counts = Object.fromEntries(countEntries);
    counts.all = Object.values(counts).reduce((a, b) => a + b, 0);

    // Newest first across sources: take the top `page * PAGE_SIZE` of each, merge, slice.
    const take = page * PAGE_SIZE;
    const perSource = await Promise.all(
      typeKeys.map(async (key) => {
        const src = SOURCES[key];
        const docs = await src.model
          .find(buildQuery(src, search, matchedUserIds))
          .select(src.projection)
          .sort({ createdAt: -1 })
          .limit(take)
          .lean();
        return docs.map((d) => ({
          id: `${key}:${d._id}`,
          type: key,
          typeLabel: src.label,
          userId: d.userId,
          createdAt: d.createdAt,
          ...src.map(d),
        }));
      })
    );

    const merged = perSource
      .flat()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pageRows = merged.slice((page - 1) * PAGE_SIZE, take);
    const total = typeKeys.reduce((sum, key) => sum + counts[key], 0);

    // Attach who made each video.
    const userIds = [...new Set(pageRows.map((r) => r.userId).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ userId: { $in: userIds } }).select("userId fullName email phone").lean()
      : [];
    const byUserId = new Map(users.map((u) => [u.userId, u]));

    const rows = pageRows.map((r) => {
      const u = byUserId.get(r.userId);
      return {
        ...r,
        user: u ? { fullName: u.fullName || "", email: u.email || "", phone: u.phone || "" } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: rows,
      counts,
      page,
      pageSize: PAGE_SIZE,
      hasMore: take < total,
    });
  } catch (err) {
    console.error("ADMIN AI VIDEOS ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
