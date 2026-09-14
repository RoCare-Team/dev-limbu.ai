import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import CgiVideo from "@/models/CgiVideo";
import { ensurePostForCgiVideo, attachLinkedPosts } from "@/lib/videoRecordPost";

// Links a pending Post (approve → publish flow) and returns the row with `post`.
// A Post failure never loses the ad — it can be retried from the card's Approve (PATCH).
async function withPost(record) {
  let post = null;
  try {
    post = await ensurePostForCgiVideo(record);
  } catch (postErr) {
    console.error("CGI VIDEO POST CREATE ERROR:", postErr);
  }
  const saved = await CgiVideo.findById(record._id).lean();
  return { ...saved, post };
}

// -----------------------------
// SAVE A GENERATED CGI AD (POST)
// Idempotent per taskId: `created` is true only for the first save, and the
// client charges the wallet only then — so a reload or second tab that also
// sees the job finish never double-charges.
// -----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      userId,
      taskId,
      businessName,
      productName,
      keywords,
      adCopy,
      musicMood,
      musicMoodReason,
      videoUrl,
      storageWarning,
      cost,
    } = body;

    if (!userId || !taskId || !businessName || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "userId, taskId, businessName and videoUrl are required." },
        { status: 400 }
      );
    }

    const existing = await CgiVideo.findOne({ taskId });
    if (existing) {
      return NextResponse.json({ success: true, created: false, data: await withPost(existing) });
    }

    try {
      const record = await CgiVideo.create({
        userId,
        taskId,
        businessName,
        productName: productName || "",
        keywords: keywords || "",
        adCopy: {
          headline: adCopy?.headline || null,
          businessNameLine: adCopy?.businessNameLine || null,
          cta: adCopy?.cta || null,
        },
        musicMood: musicMood || null,
        musicMoodReason: musicMoodReason || null,
        videoUrl,
        storageWarning: storageWarning || null,
        cost: typeof cost === "number" ? cost : 300,
      });
      return NextResponse.json({ success: true, created: true, data: await withPost(record) });
    } catch (err) {
      // Lost a race with a concurrent save of the same task.
      if (err?.code === 11000) {
        const record = await CgiVideo.findOne({ taskId });
        return NextResponse.json({ success: true, created: false, data: await withPost(record) });
      }
      throw err;
    }
  } catch (err) {
    console.error("CGI VIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// ENABLE POSTING FOR AN OLDER AD (PATCH)
// { id, userId } → creates + links its Post if missing; returns the row with `post`.
// Done on demand (not in GET) so opening the page never floods the user's post
// library with Posts for every past ad.
// -----------------------------
export async function PATCH(req) {
  try {
    await dbConnect();
    const { id, userId } = await req.json();

    if (!id || !userId || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Valid id and userId are required." },
        { status: 400 }
      );
    }

    const record = await CgiVideo.findOne({ _id: id, userId });
    if (!record) {
      return NextResponse.json({ success: false, error: "Ad not found." }, { status: 404 });
    }

    const data = await withPost(record);
    if (!data.post) {
      return NextResponse.json(
        { success: false, error: "Could not prepare this ad for posting." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("CGI VIDEO ENABLE POSTING ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S GENERATED CGI ADS (GET)
// Each row carries its linked Post as `post` (null when not linked yet / deleted).
// -----------------------------
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query param is required." },
        { status: 400 }
      );
    }

    const videos = await CgiVideo.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    const data = await attachLinkedPosts(videos, userId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("CGI VIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
