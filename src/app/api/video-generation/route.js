import { NextResponse } from "next/server";
import { generateVideo } from "@/lib/textToVideoApi";

export const maxDuration = 900; // seconds — generation can take up to ~15 min

export async function POST(req) {
  try {
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

    const files = {};
    for (const field of ["logo", "character", "background", "product"]) {
      const file = incomingForm.get(field);
      if (file && typeof file === "object" && file.size > 0) files[field] = file;
    }

    const { ok, status, data } = await generateVideo({
      businessName: business_name,
      text: script ? undefined : text,
      script: script || undefined,
      // Language only applies when generating from plain text — a script already fixes its own language.
      language: !script ? incomingForm.get("language") || undefined : undefined,
      keywords: incomingForm.get("keywords") || undefined,
      presenterGender: incomingForm.get("presenter_gender") || undefined,
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
