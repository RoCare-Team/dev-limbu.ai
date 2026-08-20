import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AiAvatarVideo from "@/models/AiAvatarVideo";

// -----------------------------
// SAVE A GENERATED AVATAR VIDEO (POST)
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

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error("AI AVATAR VIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S GENERATED AVATAR VIDEOS (GET)
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

    const videos = await AiAvatarVideo.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: videos });
  } catch (err) {
    console.error("AI AVATAR VIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
