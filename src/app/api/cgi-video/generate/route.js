import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

// The API renders a 20-second ad as two 10-second clips joined with a crossfade,
// so it costs two generations upstream. Only these two lengths exist.
const ALLOWED_DURATIONS = [10, 20];

// Straight from the service's OpenAPI enums — anything else is refused there.
const MUSIC_MOODS = ["auto", "upbeat", "cinematic", "chill", "luxury", "energetic", "none"];
const VISUAL_STYLES = [
  "auto",
  "high_key",
  "dark_luxe",
  "neon_tech",
  "golden_hour",
  "liquid_energy",
  "pastel_minimal",
  "monochrome",
  "gradient_glow",
];

// Returns once the job is queued and the ad copy is written; the render itself
// is polled through /api/cgi-video/task.
export const maxDuration = 180;

function isFile(value) {
  return value && typeof value === "object" && typeof value.size === "number" && value.size > 0;
}

function imageError(file, label) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${label} must be a PNG, JPG or WEBP image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${label} must be under 15 MB.`;
  }
  return null;
}

export async function POST(req) {
  try {
    const incoming = await req.formData();

    const businessName = String(incoming.get("business_name") || "").trim();
    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "business_name is required." },
        { status: 400 }
      );
    }

    const product = incoming.get("product");
    const productUrl = String(incoming.get("product_url") || "").trim();
    if (!isFile(product) && !productUrl) {
      return NextResponse.json(
        { success: false, error: "A product image is required." },
        { status: 400 }
      );
    }

    const forward = new FormData();
    forward.append("business_name", businessName);

    if (isFile(product)) {
      const err = imageError(product, "Product image");
      if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
      forward.append("product", product, product.name);
    } else {
      forward.append("product_url", productUrl);
    }

    const logo = incoming.get("logo");
    if (isFile(logo)) {
      const err = imageError(logo, "Logo");
      if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });
      forward.append("logo", logo, logo.name);
    }

    for (const field of ["product_name", "keywords"]) {
      const value = String(incoming.get(field) || "").trim();
      if (value) forward.append(field, value);
    }

    const rawDuration = Number(incoming.get("duration_seconds"));
    forward.append(
      "duration_seconds",
      String(ALLOWED_DURATIONS.includes(rawDuration) ? rawDuration : 10)
    );

    const mood = String(incoming.get("music_mood") || "auto").trim();
    forward.append("music_mood", MUSIC_MOODS.includes(mood) ? mood : "auto");

    const style = String(incoming.get("visual_style") || "auto").trim();
    forward.append("visual_style", VISUAL_STYLES.includes(style) ? style : "auto");

    // Reproduces an earlier ad's camera move and typography.
    const seed = String(incoming.get("look_seed") || "").trim();
    if (seed && Number.isFinite(Number(seed))) forward.append("look_seed", seed);

    // `wait` stays off: the browser polls, so this request never holds a
    // connection open for the whole render.

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 170 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(`${CGI_VIDEO_API_URL}/api/generate-ad`, {
        method: "POST",
        headers: cgiVideoHeaders(), // no Content-Type — fetch sets the boundary
        body: forward,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await readUpstreamJson(externalRes);

    if (!externalRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: upstreamErrorMessage(
            externalRes.status,
            data,
            "Failed to start CGI ad generation. Please try again."
          ),
        },
        { status: externalRes.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("CGI VIDEO GENERATE ERROR:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "The CGI video service took too long to respond. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
