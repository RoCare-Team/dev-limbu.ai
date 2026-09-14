import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import AiAvatarVideo from "@/models/AiAvatarVideo";
import { ensurePostForAiAvatarVideo, attachLinkedPosts } from "@/lib/videoRecordPost";

// -----------------------------
// SAVE A GENERATED AVATAR VIDEO (POST)
// Also creates the pending Post the approve → publish flow runs on, and returns
// it as `data.post`. A Post failure never loses the video — it can be retried
// later from the card's Approve button (PATCH).
// -----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      userId,
      mode,
      characterId,
      characterName,
      script,
      background,
      pose,
      language,
      voiceId,
      voiceName,
      aspectRatio,
      resolution,
      videoUrl,
      videoId,
      storage,
      durationSeconds,
      cost,
    } = body;

    if (!userId || !mode || !script || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "userId, mode, script and videoUrl are required." },
        { status: 400 }
      );
    }

    const record = await AiAvatarVideo.create({
      userId,
      mode: mode === "photo" ? "photo" : "character",
      characterId: characterId || null,
      characterName: characterName || null,
      script,
      background: background || "",
      pose: pose || "",
      language: language || null,
      voiceId: voiceId || null,
      voiceName: voiceName || null,
      aspectRatio: aspectRatio || "16:9",
      resolution: resolution || "1080p",
      videoUrl,
      videoId: videoId || null,
      storage: storage || null,
      durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
      cost: typeof cost === "number" ? cost : 350,
    });

    let post = null;
    try {
      post = await ensurePostForAiAvatarVideo(record);
    } catch (postErr) {
      console.error("AI AVATAR VIDEO POST CREATE ERROR:", postErr);
    }

    const saved = await AiAvatarVideo.findById(record._id).lean();
    return NextResponse.json({ success: true, data: { ...saved, post } });
  } catch (err) {
    console.error("AI AVATAR VIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// ENABLE POSTING FOR AN OLDER VIDEO (PATCH)
// { id, userId } → creates + links its Post if missing; returns the row with `post`.
// Done on demand (not in GET) so opening the page never floods the user's post
// library with Posts for every past video.
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

    const record = await AiAvatarVideo.findOne({ _id: id, userId });
    if (!record) {
      return NextResponse.json({ success: false, error: "Video not found." }, { status: 404 });
    }

    const post = await ensurePostForAiAvatarVideo(record);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Could not prepare this video for posting." },
        { status: 500 }
      );
    }

    const saved = await AiAvatarVideo.findById(id).lean();
    return NextResponse.json({ success: true, data: { ...saved, post } });
  } catch (err) {
    console.error("AI AVATAR VIDEO ENABLE POSTING ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S GENERATED AVATAR VIDEOS (GET)
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

    const videos = await AiAvatarVideo.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    const data = await attachLinkedPosts(videos, userId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("AI AVATAR VIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
