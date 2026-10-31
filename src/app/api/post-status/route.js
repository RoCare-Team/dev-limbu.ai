import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import AiContentReport from "@/models/AiContentReport";
import User from "@/models/User";
import Admin from "@/models/Admin";

// Helper to return JSON response
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const PLATFORM_ALIASES = {
  gmb: "gmb",
  google: "gmb",
  googlebusiness: "gmb",
  google_business: "gmb",
  facebook: "facebook",
  fb: "facebook",
  instagram: "instagram",
  ig: "instagram",
  pinterest: "pinterest",
  pin: "pinterest",
  pi: "pinterest",
  linkedin: "linkedin",
  li: "linkedin",
  youtube: "youtube",
  yt: "youtube",
};

const DEFAULT_WHEN_POSTED = [
  "gmb",
  "facebook",
  "instagram",
  "pinterest",
  "linkedin",
  "youtube",
].map((platform) => ({
  platform,
  posted: false,
  postedDate: null,
  postId: "",
  error: "",
}));

const normalizePlatform = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  const compact = normalized.replace(/[\s-]/g, "");
  return PLATFORM_ALIASES[normalized] || PLATFORM_ALIASES[compact] || null;
};

const normalizePostedPlatform = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "both") return "both";
  return normalizePlatform(normalized);
};

const mergePostedPlatform = (existingValue, incomingValue) => {
  const existing = normalizePostedPlatform(existingValue);
  const incoming = normalizePostedPlatform(incomingValue);
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing === "both" || incoming === "both") return "both";
  if (existing !== incoming) return "both";
  return existing;
};

const isValidDate = (value) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
};

const toDateOrNull = (value) => (isValidDate(value) ? new Date(value) : null);

const normalizePlatformPost = (platform, value, existing = null) => {
  const base = {
    platform,
    posted: Boolean(existing?.posted),
    postedDate: existing?.postedDate || null,
    postId: existing?.postId || "",
    error: existing?.error || "",
  };

  if (value === undefined || value === null) return base;

  if (typeof value === "boolean") {
    return {
      ...base,
      posted: value,
      postedDate: value ? new Date() : null,
      error: value ? "" : base.error,
    };
  }

  if (typeof value === "string" || value instanceof Date) {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    const looksPosted = normalized === "posted" || normalized === "true";
    const postedDate = toDateOrNull(value);

    return {
      ...base,
      posted: looksPosted || Boolean(postedDate),
      postedDate: postedDate || (looksPosted ? new Date() : base.postedDate),
      error: looksPosted || postedDate ? "" : base.error,
    };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const posted =
      typeof value.posted === "boolean"
        ? value.posted
        : value.isPosted === true || value.status === "posted" || base.posted;
    const postedDate =
      toDateOrNull(value.postedDate) ||
      toDateOrNull(value.postedAt) ||
      toDateOrNull(value.date) ||
      (posted && !base.postedDate ? new Date() : base.postedDate);

    return {
      ...base,
      posted,
      postedDate: posted ? postedDate : null,
      postId:
        typeof value.postId === "string"
          ? value.postId
          : typeof value.id === "string"
            ? value.id
            : base.postId,
      error: typeof value.error === "string" ? value.error : posted ? "" : base.error,
    };
  }

  return base;
};

const mergeWhenPosted = (existingWhenPosted, incomingWhenPosted) => {
  const byPlatform = new Map(
    DEFAULT_WHEN_POSTED.map((item) => [item.platform, { ...item }]),
  );

  const applyEntry = (platformValue, value) => {
    const platform = normalizePlatform(platformValue);
    if (!platform) return;
    byPlatform.set(
      platform,
      normalizePlatformPost(platform, value, byPlatform.get(platform)),
    );
  };

  const applyCollection = (collection) => {
    if (!collection) return;

    if (Array.isArray(collection)) {
      collection.forEach((entry) => {
        if (!entry || typeof entry !== "object") return;
        applyEntry(entry.platform, entry);
      });
      return;
    }

    if (typeof collection === "object") {
      Object.entries(collection).forEach(([key, value]) => {
        if (/^\d+$/.test(key) && value && typeof value === "object") {
          applyEntry(value.platform, value);
          return;
        }
        applyEntry(key, value);
      });
    }
  };

  applyCollection(existingWhenPosted);
  applyCollection(incomingWhenPosted);

  return DEFAULT_WHEN_POSTED.map(({ platform }) => byPlatform.get(platform));
};

/**
 * Attach the latest AI content report (if any) to each post as `aiContentReport`.
 * Posts with no report get `aiContentReport: null`.
 */
const attachAiContentReports = async (posts) => {
  const list = Array.isArray(posts) ? posts : [posts];
  const ids = list.map((p) => String(p?._id || "")).filter(Boolean);
  if (ids.length === 0) return posts;

  const reports = await AiContentReport.find({ postId: { $in: ids } })
    .sort({ createdAt: -1 })
    .lean();

  // Sorted newest first -> first hit per postId is the latest report.
  const latestByPost = new Map();
  reports.forEach((r) => {
    if (!latestByPost.has(r.postId)) latestByPost.set(r.postId, r);
  });

  list.forEach((post) => {
    const report = latestByPost.get(String(post._id));
    post.aiContentReport = report
      ? {
          reportId: String(report._id),
          reason: report.reason || "",
          details: report.details || "",
          mediaType: report.mediaType || "",
          mediaUrl: report.mediaUrl || "",
          source: report.source || "",
          status: report.status || "pending",
          reportedAt: report.reportedAt || report.createdAt || null,
        }
      : null;
  });

  return posts;
};

/**
 * GET -> Fetch posts by userId (e.g., MB-02) and optional status
 * Query: ?userId=MB-02&status=pending&id=123&page=1&limit=10
 * Each post carries `aiContentReport` (latest report) or null.
 */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    // Pagination parameters
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 0; // 0 means all for backward compatibility
    const skip = (page - 1) * limit;

    // Date filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build the query object dynamically
    const query = {};
    if (userId) {
      query.userId = userId;
    }

    // Scope posts to the logged-in admin/agent/manager's own users
    // (mirrors the role-based scoping used in /api/users)
    if (!id && email) {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return json({ success: false, error: "Admin not found" }, 404);
      }

      if (admin.role === "agent" || admin.role === "manager") {
        const ownerField =
          admin.role === "agent" ? "assignedAgentId" : "accountManager";
        const scopedUsers = await User.find({ [ownerField]: admin._id })
          .select("userId")
          .lean();
        const scopedUserIds = scopedUsers.map((u) => u.userId).filter(Boolean);

        query.userId = scopedUserIds.length
          ? { $in: scopedUserIds }
          : "__none__"; // no users assigned -> no posts should match
      }
    }

    if (status === "videos") {
      query.$or = [
        { mediaType: "video" },
        // Not `{ $ne: "", $ne: null }` — a duplicate key keeps only the last one,
        // which let every image post with videoOutput: "" into the Videos tab.
        { videoOutput: { $exists: true, $nin: ["", null] } },
        {
          aiOutput: {
            $regex: "\\.(mp4|webm|mov)$",
            $options: "i"
          }
        }
      ];
      // Only show non-rejected videos in the video tab by default, 
      // or should we show all? Usually tabs filter by one thing.
      // Let's match the "total" tab's behavior of excluding rejected if needed,
      // but the user didn't specify. For now, let's just filter by video criteria.
      query.status = { $ne: "rejected" };
    } else if (status === "posted") {
      query.status = { $in: ["posted", "partial_failed"] };
    } else if (status) {
      query.status = status;
    }

    // Date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Single post
    if (id) {
      const findOneQuery = { _id: id };
      if (userId) {
        findOneQuery.userId = userId;
      }
      const post = await Post.findOne(findOneQuery)
        .select("-accessToken -refreshToken") // Exclude sensitive fields
        .lean();

      if (!post) return json({ success: false, error: "Post not found" }, 404);
      await attachAiContentReports(post);
      return json({ success: true, data: post });
    }

    // Total count for frontend pagination UI
    const totalCount = await Post.countDocuments(query);

    // Count-only mode (e.g. dashboard "Total Posts" card) — skip fetching full docs
    if (searchParams.get("countOnly") === "true") {
      return json({
        success: true,
        data: [],
        count: totalCount,
        pagination: {
          totalItems: totalCount,
          totalPages: 1,
          currentPage: 1,
          limit: 0,
        },
      });
    }

    // Multiple posts (paginated)
    let queryBuilder = Post.find(query).sort({ createdAt: -1 });

    if (limit > 0) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const posts = await queryBuilder
      .select("-accessToken -refreshToken") // Exclude sensitive fields
      .lean();

    await attachAiContentReports(posts);

    return json({
      success: true,
      data: posts,
      count: totalCount,
      pagination: {
        totalItems: totalCount,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        limit: limit
      }
    });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * POST -> Create post OR bulk counts
 */
/**
 * POST -> Create post OR bulk counts
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // console.log("Received POST /api/post-status with body:", body);

    // Bulk counts
    if (Array.isArray(body.userIds)) {
      const { userIds } = body;

      if (userIds.length === 0) {
        return json({ success: true, data: {} });
      }

      const counts = await Post.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: "$userId",
            total: {
              $sum: {
                $cond: [{ $ne: ["$status", "rejected"] }, 1, 0]
              }
            },
            posted: { $sum: { $cond: [{ $in: ["$status", ["posted", "partial_failed"]] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            scheduled: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
            videos: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "rejected"] },
                      {
                        $or: [
                          { $eq: ["$mediaType", "video"] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$videoOutput", ""] } }, 0] },
                          {
                            $regexMatch: {
                              input: { $ifNull: ["$aiOutput", ""] },
                              regex: "\\.(mp4|webm|mov)$",
                              options: "i"
                            }
                          }
                        ]
                      }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
          },
        },
      ]);

      const countsMap = counts.reduce((acc, item) => {
        acc[item._id] = item;
        delete item._id;
        return acc;
      }, {});

      return json({ success: true, data: countsMap });
    }

    // Create new post
    const {
      userId,
      status,
      aiOutput,
      description,
      promat,
      gmbDescription,
      fbDescription,
      igDescription,
        liDescription,   // 👈 ADDED
        piDescription,   // 👈 ADDED
        pinTitle,        // 👈 ADDED
        ytDescription,
      whenPosted,
      mediaType,
      videoOutput,
      videoPrompt,
      mediaStatus,
      postedPlatform,
    } = body;

    // if (!userId || !aiOutput || !description) {
    //   return json(
    //     { success: false, error: "userId, aiOutput, and description are required" },
    //     400
    //   );
    // }

    const mt =
      mediaType === "video" || mediaType === "image" ? mediaType : "image";
    const normalizedCreatePlatform = normalizePostedPlatform(postedPlatform);
    const initialWhenPosted =
      whenPosted !== undefined && whenPosted !== null
        ? mergeWhenPosted(null, whenPosted)
        : status === "posted" &&
            normalizedCreatePlatform &&
            normalizedCreatePlatform !== "both"
          ? mergeWhenPosted(null, { [normalizedCreatePlatform]: true })
          : null;

    const newPost = await Post.create({
      userId,
      aiOutput,
      mediaType: mt,
      description,
      gmbDescription,
      fbDescription,
      igDescription,
      liDescription,   // 👈 ADDED
      piDescription,   // 👈 ADDED
      pinTitle,        // 👈 ADDED
      ytDescription,
      promat,
      ...(initialWhenPosted ? { whenPosted: initialWhenPosted } : {}),
      status: status || "pending",
      ...(typeof videoOutput === "string" && videoOutput.trim()
        ? { videoOutput: videoOutput.trim() }
        : {}),
      ...(typeof videoPrompt === "string" && videoPrompt.trim()
        ? { videoPrompt: videoPrompt.trim() }
        : {}),
      ...(typeof postedPlatform === "string" && postedPlatform.trim()
        ? { postedPlatform: postedPlatform.trim() }
        : {}),
      mediaStatus: {
        ...(mediaStatus && typeof mediaStatus === "object" ? mediaStatus : {}),
        ...(aiOutput ? { image: "pending" } : {}),
        ...(videoOutput ? { video: "pending" } : {}),
      },
    });

    return json({ success: true, data: newPost }, 201);

  } catch (err) {
    console.error("Error saving post:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * PUT -> Update post (status, scheduledDate, whenPosted)
 */
export async function PUT(req) {
  try {
    await dbConnect();

    const {
      id,
      status,
      scheduledDate,
      userId,
      description,
      gmbDescription,
      fbDescription,
      igDescription,
      liDescription,
      piDescription,
      pinTitle,
      ytDescription,
      reason,
      locations,
      checkmark,
      meta,
      gmbPostMeta,
      refreshToken,
      whenPosted,
      scheduledDateSource,
      fbPages,
      aiOutput,
      igPages,
      mediaType,
      videoOutput,
      videoPrompt,
      facebookPostId,
      facebookPageAccessToken,
      postedPlatform,
      error: postError,
      mediaStatus,
    } = await req.json();

   

    // ✅ FIX: status optional karo — sirf id aur userId required
    if (!id || !userId) {
      return json(
        { success: false, error: "id & userId required" },
        400
      );
    }

    // ✅ FIX: status sirf tab add karo jab aaya ho
    const updateData = {};
    if (status) {
      updateData.status = status;
    }

    let currentPostCache = null;
    const getCurrentPost = async () => {
      if (currentPostCache) return currentPostCache;
      currentPostCache = await Post.findOne({ _id: id, userId });
      return currentPostCache;
    };

    /* ---------- SCHEDULED ---------- */
    if (status === "scheduled") {
      if (!scheduledDate) {
        return json({ success: false, error: "scheduledDate required" }, 400);
      }
      const parsedDate = new Date(scheduledDate);
      if (isNaN(parsedDate.getTime())) {
        return json({ success: false, error: "Invalid scheduledDate" }, 400);
      }
      updateData.scheduledDate = parsedDate;

      if (scheduledDateSource) updateData.scheduledDateSource = scheduledDateSource;
      if (refreshToken) updateData.refreshToken = refreshToken;

      if (Array.isArray(locations) && locations.length > 0) {
        updateData.locations = locations.map(loc => ({
          locationId: loc.locationId,
          accountId: loc.accountId,
          name: loc.name || loc.title || loc.locationName || loc.storeName || "",
          address: loc.address,
          city: loc.city || "",
          locality: loc.locality || "",
          websiteUrl: loc.websiteUrl || "",
          primaryPhone: loc.primaryPhone || "",
          isPosted: false,
          error: ""
        }));
      }
      if (Array.isArray(fbPages)) updateData.fbPages = fbPages;
      if (Array.isArray(igPages)) updateData.igPages = igPages;

      const rawGmbMeta = gmbPostMeta || meta;
      if (rawGmbMeta && typeof rawGmbMeta === "object" && !Array.isArray(rawGmbMeta)) {
        updateData.gmbPostMeta = {
          postType: rawGmbMeta.postType || "standard",
          ctaType: rawGmbMeta.ctaType || "book",
          customUrl: rawGmbMeta.customUrl || "",
          eventTitle: rawGmbMeta.eventTitle || "",
          startDate: rawGmbMeta.startDate || "",
          endDate: rawGmbMeta.endDate || "",
        };
      }
    }

    /* ---------- REJECTED ---------- */
    if (status === "rejected") {
      if (!reason || reason.trim() === "") {
        return json({ success: false, error: "Reject reason is required" }, 400);
      }
      updateData.rejectReason = reason;
    }

    /* ---------- OPTIONAL FIELDS ---------- */
    if (typeof description === "string") updateData.description = description;
    if (typeof aiOutput === "string") updateData.aiOutput = aiOutput;
    if (mediaType === "image" || mediaType === "video") updateData.mediaType = mediaType;
    if (typeof gmbDescription === "string") updateData.gmbDescription = gmbDescription;
    if (typeof fbDescription === "string") updateData.fbDescription = fbDescription;
    if (typeof igDescription === "string") updateData.igDescription = igDescription;
    if (typeof liDescription === "string") updateData.liDescription = liDescription;   // ✅
    if (typeof piDescription === "string") updateData.piDescription = piDescription;   // ✅
    if (typeof pinTitle === "string") updateData.pinTitle = pinTitle;   // ✅
    if (typeof ytDescription === "string") updateData.ytDescription = ytDescription;
    if (checkmark !== undefined && checkmark !== null) updateData.checkmark = checkmark;
    if (typeof videoOutput === "string" && videoOutput.trim()) updateData.videoOutput = videoOutput.trim();
    if (typeof videoPrompt === "string") updateData.videoPrompt = videoPrompt.trim();
    if (typeof facebookPostId === "string" && facebookPostId.trim()) updateData.facebookPostId = facebookPostId.trim();
    if (typeof facebookPageAccessToken === "string" && facebookPageAccessToken.trim()) updateData.facebookPageAccessToken = facebookPageAccessToken.trim();

    let normalizedIncomingPostedPlatform = null;
    if (typeof postedPlatform === "string") {
      normalizedIncomingPostedPlatform = normalizePostedPlatform(postedPlatform);
      const currentPost = await getCurrentPost();
      const mergedPlatform = mergePostedPlatform(currentPost?.postedPlatform, postedPlatform);
      if (mergedPlatform) updateData.postedPlatform = mergedPlatform;
    }

    if (typeof postError === "string") updateData.error = postError;

    if (whenPosted !== undefined && whenPosted !== null) {
      const currentPost = await getCurrentPost();
      updateData.whenPosted = mergeWhenPosted(currentPost?.whenPosted, whenPosted);
    } else if (
      status === "posted" &&
      normalizedIncomingPostedPlatform &&
      normalizedIncomingPostedPlatform !== "both"
    ) {
      const currentPost = await getCurrentPost();
      updateData.whenPosted = mergeWhenPosted(currentPost?.whenPosted, {
        [normalizedIncomingPostedPlatform]: true,
      });
    }

    if (mediaStatus && typeof mediaStatus === "object" && !Array.isArray(mediaStatus)) {
      const allowedMediaStatus = ["pending", "approved", "rejected", "posted", "failed"];
      for (const key of ["image", "video"]) {
        const val = mediaStatus[key];
        if (typeof val === "string" && allowedMediaStatus.includes(val)) {
          updateData[`mediaStatus.${key}`] = val;
        }
      }
    }

    if (
      typeof videoOutput === "string" &&
      videoOutput.trim() &&
      updateData["mediaStatus.video"] === undefined
    ) {
      const currentPost = await getCurrentPost();
      const currentVideoStatus = currentPost?.mediaStatus?.video;
      if (!currentVideoStatus || currentVideoStatus === "failed") {
        updateData["mediaStatus.video"] = "pending";
      }
    }

    // ✅ Agar kuch update karne ko nahi hai
    if (Object.keys(updateData).length === 0) {
      return json({ success: false, error: "Nothing to update" }, 400);
    }

    console.log("🛠 Updating Post:", updateData);

    const postDoc = await Post.findOne({ _id: id, userId });
    if (!postDoc) {
      return json({ success: false, error: "Post not found" }, 404);
    }

    // Apply updates manually to the document
    for (const key in updateData) {
      if (key.startsWith("mediaStatus.")) {
        const mediaKey = key.split(".")[1];
        if (!postDoc.mediaStatus) postDoc.mediaStatus = {};
        postDoc.mediaStatus[mediaKey] = updateData[key];
        postDoc.markModified("mediaStatus");
      } else {
        postDoc[key] = updateData[key];
      }
    }

    if (updateData.whenPosted) {
      postDoc.markModified("whenPosted");
    }

    const updated = await postDoc.save();

    return json({ success: true, data: updated });

  } catch (err) {
    console.error("Update Post Error:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * DELETE -> Soft reject post
 */
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return json({ success: false, error: "id & userId required" }, 400);
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: id, userId },
      { status: "rejected" },
      { new: true }
    );

    if (!updatedPost) {
      return json({ success: false, error: "Post not found" }, 404);
    }

    return json({
      success: true,
      message: "Post rejected successfully",
      post: updatedPost
    });

  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}
