import { NextResponse } from "next/server";

const AVATAR_API_URL = "https://ai-avatar.limbutech.in";
const AVATAR_API_KEY =
  "b6e0fa3be252c49f443b49ecf4bb44e522e2d9f910784e6fa8f5b5f9ad9a0ff5";

export const maxDuration = 120; // image preview only — 20-60s typical

export async function POST(req) {
  try {
    const incomingForm = await req.formData();

    const mode = incomingForm.get("mode");
    if (mode !== "character" && mode !== "photo") {
      return NextResponse.json(
        { success: false, error: "mode must be 'character' or 'photo'." },
        { status: 400 }
      );
    }

    const forwardForm = new FormData();
    forwardForm.append("mode", mode);

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

    for (const field of ["background", "pose", "aspect_ratio", "image_provider"]) {
      const value = incomingForm.get(field);
      if (value) forwardForm.append(field, value);
    }

    const logo = incomingForm.get("logo");
    if (logo && typeof logo === "object" && logo.size > 0) {
      forwardForm.append("logo", logo, logo.name);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(`${AVATAR_API_URL}/generate-image`, {
        method: "POST",
        headers: { "X-API-Key": AVATAR_API_KEY },
        body: forwardForm,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = externalRes.headers.get("content-type") || "";

    if (!externalRes.ok || contentType.includes("application/json")) {
      const data = await externalRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: data?.error || "Image generation failed. Please try again." },
        { status: externalRes.ok ? 502 : externalRes.status }
      );
    }

    const imageBuffer = await externalRes.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: { "Content-Type": contentType || "image/jpeg" },
    });
  } catch (error) {
    console.error("AI AVATAR GENERATE-IMAGE ERROR:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Image generation timed out. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
