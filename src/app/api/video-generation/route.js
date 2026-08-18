import { NextResponse } from "next/server";

const TEXTTOVIDEO_API_URL = "https://texttovideo.limbutech.in/api/generate-video";
const TEXTTOVIDEO_API_KEY = "7f3a9c2e8b1d4f6a0e5c3b8d2a7f1e9c4b6d8a0f2e5c7b9d1a3f6e8c0b2d4a7f";

export const maxDuration = 900; // seconds — generation can take up to ~15 min

export async function POST(req) {
  try {
    const apiKey = TEXTTOVIDEO_API_KEY;

    const incomingForm = await req.formData();

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

    // Rebuild a fresh FormData to forward to the external API
    const forwardForm = new FormData();
    forwardForm.append("business_name", business_name);
    if (script) {
      forwardForm.append("script", script);
    } else {
      forwardForm.append("text", text);
    }
    forwardForm.append("wait", incomingForm.get("wait") || "true");

    const keywords = incomingForm.get("keywords");
    if (keywords) forwardForm.append("keywords", keywords);

    const presenterGender = incomingForm.get("presenter_gender");
    if (presenterGender) forwardForm.append("presenter_gender", presenterGender);

    // Language only applies when generating from plain text — a script already fixes its own language.
    const language = incomingForm.get("language");
    if (!script && language) forwardForm.append("language", language);

    for (const field of ["logo", "character", "background", "product"]) {
      const file = incomingForm.get(field);
      if (file && typeof file === "object" && file.size > 0) {
        forwardForm.append(field, file, file.name);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 890 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(TEXTTOVIDEO_API_URL, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
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
        {
          success: false,
          error:
            data?.error || data?.message || "Video generation failed. Please try again.",
          details: data,
        },
        { status: externalRes.status }
      );
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
