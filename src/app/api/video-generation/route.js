import { NextResponse } from "next/server";
import { generateVideo } from "@/lib/textToVideoApi";
import dbConnect from "@/lib/dbConnect";
import TextToVideo from "@/models/TextToVideo";

export const maxDuration = 900; // seconds — generation can take up to ~15 min

// Only these lengths are offered in the UI; anything else falls back to the default.
const ALLOWED_VIDEO_DURATIONS = [10, 20];
const DEFAULT_VIDEO_DURATION = 10;

export async function POST(req) {
  try {
    const incomingForm = await req.formData();

    const userId = incomingForm.get("userId"); // optional — when present, auto-saves to history
    const business_name = incomingForm.get("business_name");
    // Mutually exclusive: either a plain "text" brief or a ready-made "script" — never both.
    const text = incomingForm.get("text");
    const script = incomingForm.get("script");

    if (!business_name || (!text && !script)) {
      return NextResponse.json(
        { success: false, error: "business_name and either text or script are required." },
        { status: 400 }
      );
    }

    const files = {};
    for (const field of ["logo", "character", "background", "product"]) {
      const file = incomingForm.get(field);
      if (file && typeof file === "object" && file.size > 0) files[field] = file;
    }

    const language = !script ? incomingForm.get("language") || undefined : undefined;
    const keywords = incomingForm.get("keywords") || undefined;
    const presenterGender = incomingForm.get("presenter_gender") || undefined;

    const requestedDuration = Number(incomingForm.get("duration"));
    const duration = ALLOWED_VIDEO_DURATIONS.includes(requestedDuration)
      ? requestedDuration
      : DEFAULT_VIDEO_DURATION;

    const { ok, status, data } = await generateVideo({
      businessName: business_name,
      text: script ? undefined : text,
      script: script || undefined,
      // Language only applies when generating from plain text — a script already fixes its own language.
      language,
      keywords,
      presenterGender,
      duration,
      wait: (incomingForm.get("wait") || "true") === "true",
      files,
    });

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.message || "Video generation failed. Please try again.",
          details: data,
        },
        { status }
      );
    }

    // Auto-save to MongoDB when a userId is provided — so mobile/other clients
    // don't need a separate "save" call after generation finishes.
    if (userId) {
      const videoUrl =
        data?.video_url || data?.videoUrl || data?.output || data?.url || data?.secure_url || data?.playback_url || null;

      if (videoUrl) {
        try {
          await dbConnect();
          const record = await TextToVideo.create({
            userId,
            businessName: business_name,
            inputMode: script ? "script" : "text",
            content: (script || text || "").toString(),
            language: language || null,
            keywords: keywords || "",
            presenterGender: presenterGender === "female" ? "female" : "male",
            durationSeconds: duration,
            videoUrl,
            taskId: data?.task_id || null,
            finalScript: data?.final_script || null,
            captions: data?.captions || undefined,
            cost: 300,
          });
          return NextResponse.json({ success: true, data, saved: record });
        } catch (saveErr) {
          console.error("VIDEO GENERATION AUTO-SAVE ERROR:", saveErr);
          // Still return the generated video even if the DB write failed.
          return NextResponse.json({ success: true, data, saved: null, saveError: saveErr.message });
        }
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("VIDEO GENERATION API ERROR:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Video generation timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
