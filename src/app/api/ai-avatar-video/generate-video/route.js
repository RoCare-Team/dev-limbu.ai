import { NextResponse } from "next/server";

const AVATAR_API_URL = "https://ai-avatar.limbutech.in";
const AVATAR_API_KEY =
  "b6e0fa3be252c49f443b49ecf4bb44e522e2d9f910784e6fa8f5b5f9ad9a0ff5";

// Passthrough fields forwarded verbatim to the external API when present.
const PASSTHROUGH_FIELDS = [
  "background",
  "pose",
  "image_provider",
  "aspect_ratio",
  "resolution",
  "fit",
  "engine",
  "expressiveness",
  "motion_prompt",
  "captions",
  "language",
  "voice_id",
  "voice_locale",
  "voice_speed",
  "voice_pitch",
  "avatar_name",
  "title",
  "use_cache",
];

export const maxDuration = 900; // seconds — synchronous render can take up to ~12 min

export async function POST(req) {
  try {
    const incomingForm = await req.formData();

    const mode = incomingForm.get("mode");
    const script = incomingForm.get("script");

    if (mode !== "character" && mode !== "photo") {
      return NextResponse.json(
        { success: false, error: "mode must be 'character' or 'photo'." },
        { status: 400 }
      );
    }
    if (!script || !String(script).trim()) {
      return NextResponse.json({ success: false, error: "script is required." }, { status: 400 });
    }

    const forwardForm = new FormData();
    forwardForm.append("mode", mode);
    forwardForm.append("script", script);

    if (mode === "character") {
      const characterId = incomingForm.get("character_id");
      if (!characterId) {
        return NextResponse.json(
          { success: false, error: "character_id is required for mode=character." },
          { status: 400 }
        );
      }
      forwardForm.append("character_id", characterId);
    } else {
      const image = incomingForm.get("image");
      const gender = incomingForm.get("gender");
      if (!image || typeof image !== "object" || image.size === 0) {
        return NextResponse.json(
          { success: false, error: "image file is required for mode=photo." },
          { status: 400 }
        );
      }
      if (!gender) {
        return NextResponse.json(
          { success: false, error: "gender is required for mode=photo." },
          { status: 400 }
        );
      }
      forwardForm.append("image", image, image.name);
      forwardForm.append("gender", gender);
    }

    const logo = incomingForm.get("logo");
    if (logo && typeof logo === "object" && logo.size > 0) {
      forwardForm.append("logo", logo, logo.name);
    }

    for (const field of PASSTHROUGH_FIELDS) {
      const value = incomingForm.get(field);
      if (value !== null && value !== undefined && value !== "") {
        forwardForm.append(field, value);
      }
    }

    // The upstream API is fully synchronous — one request, one response. It holds the
    // connection open for the whole 5-12 min render and returns the finished video_url
    // directly; there is no job id and nothing to poll.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 890 * 1000); // docs: allow at least 15 min

    let externalRes;
    try {
      externalRes = await fetch(`${AVATAR_API_URL}/generate-video`, {
        method: "POST",
        headers: { "X-API-Key": AVATAR_API_KEY },
        body: forwardForm,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await externalRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!externalRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Video generation failed. Please try again.", details: data },
        { status: externalRes.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("AI AVATAR GENERATE-VIDEO ERROR:", error);
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
