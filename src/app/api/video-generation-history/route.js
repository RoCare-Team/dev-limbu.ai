import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TextToVideo from "@/models/TextToVideo";

// -----------------------------
// SAVE A GENERATED VIDEO (POST)
// -----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      userId,
      businessName,
      inputMode,
      content,
      language,
      keywords,
      presenterGender,
      videoUrl,
      taskId,
      finalScript,
      captions,
      cost,
    } = body;

    if (!userId || !businessName || !content || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "userId, businessName, content and videoUrl are required." },
        { status: 400 }
      );
    }

    const record = await TextToVideo.create({
      userId,
      businessName,
      inputMode: inputMode === "script" ? "script" : "text",
      content,
      language: language || null,
      keywords: keywords || "",
      presenterGender: presenterGender === "female" ? "female" : "male",
      videoUrl,
      taskId: taskId || null,
      finalScript: finalScript || null,
      captions: captions || undefined,
      cost: typeof cost === "number" ? cost : 300,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error("TEXTTOVIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

const CAPTION_PLATFORM_KEYS = ["instagram", "facebook", "pinterest", "linkedin"];

// -----------------------------
// UPDATE PUBLISH STATUS OR EDIT A CAPTION (PUT)
// - { id, userId, platform, posted, postId, error } → publish-status update (after FB/IG publish attempt)
// - { id, userId, platform, caption } → user edited a ready-to-post caption
// -----------------------------
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, userId, platform } = body;

    if (!id || !userId || !platform) {
      return NextResponse.json(
        { success: false, error: "id, userId and platform are required." },
        { status: 400 }
      );
    }

    let update;

    if (typeof body.caption === "string") {
      if (!CAPTION_PLATFORM_KEYS.includes(platform)) {
        return NextResponse.json({ success: false, error: "Invalid platform." }, { status: 400 });
      }
      update = { $set: { [`captions.${platform}.caption`]: body.caption } };
    } else {
      if (!["facebook", "instagram"].includes(platform)) {
        return NextResponse.json({ success: false, error: "Invalid platform." }, { status: 400 });
      }
      const { posted, postId, error } = body;
      update = {
        $set: {
          [`published.${platform}`]: {
            posted: !!posted,
            postId: postId || "",
            postedAt: posted ? new Date() : null,
            error: error || "",
          },
        },
      };
    }

    const updated = await TextToVideo.findOneAndUpdate({ _id: id, userId }, update, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("TEXTTOVIDEO UPDATE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S GENERATED VIDEOS (GET)
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

    const videos = await TextToVideo.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: videos });
  } catch (err) {
    console.error("TEXTTOVIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
