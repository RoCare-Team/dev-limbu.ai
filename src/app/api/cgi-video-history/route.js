import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CgiVideo from "@/models/CgiVideo";

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
      return NextResponse.json({ success: true, created: false, data: existing });
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
      return NextResponse.json({ success: true, created: true, data: record });
    } catch (err) {
      // Lost a race with a concurrent save of the same task.
      if (err?.code === 11000) {
        const record = await CgiVideo.findOne({ taskId });
        return NextResponse.json({ success: true, created: false, data: record });
      }
      throw err;
    }
  } catch (err) {
    console.error("CGI VIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S GENERATED CGI ADS (GET)
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

    const videos = await CgiVideo.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: videos });
  } catch (err) {
    console.error("CGI VIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
