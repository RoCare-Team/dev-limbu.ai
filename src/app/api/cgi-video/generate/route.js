import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

// The v1 API takes the product photo as base64 inside a JSON body. Base64 adds
// ~33%, so the cap is lower than the old multipart upload's — 10 MB of image is
// already far more than a product shot needs.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_ASPECT_RATIOS = new Set(["9:16", "16:9"]);
const MIN_DURATION = 10;
const MAX_DURATION = 60;

// Creating a job returns as soon as it is queued — the render itself is polled.
export const maxDuration = 120;

function isFile(value) {
  return value && typeof value === "object" && typeof value.size === "number" && value.size > 0;
}

export async function POST(req) {
  try {
    const form = await req.formData();

    const businessName = String(form.get("business_name") || "").trim();
    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "business_name is required." },
        { status: 400 }
      );
    }

    const product = form.get("product");
    const productUrl = String(form.get("product_url") || "").trim();
    if (!isFile(product) && !productUrl) {
      return NextResponse.json(
        { success: false, error: "A product image is required." },
        { status: 400 }
      );
    }

    let imageBase64 = null;
    if (isFile(product)) {
      if (!ALLOWED_IMAGE_TYPES.includes(product.type)) {
        return NextResponse.json(
          { success: false, error: "Product image must be a PNG, JPG or WEBP image." },
          { status: 400 }
        );
      }
      if (product.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, error: "Product image must be under 10 MB." },
          { status: 400 }
        );
      }
      const bytes = Buffer.from(await product.arrayBuffer());
      // A data: URI is accepted as-is by the API and keeps the mime type with it.
      imageBase64 = `data:${product.type};base64,${bytes.toString("base64")}`;
    }

    const rawDuration = Number(form.get("duration_seconds"));
    const duration = Number.isFinite(rawDuration)
      ? Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(rawDuration)))
      : 10;

    const rawAspect = String(form.get("aspect_ratio") || "").trim();
    const aspectRatio = ALLOWED_ASPECT_RATIOS.has(rawAspect) ? rawAspect : "9:16";

    const payload = {
      business_name: businessName,
      product: {
        name: String(form.get("product_name") || "").trim(),
        keywords: String(form.get("keywords") || "").trim(),
        ...(imageBase64 ? { image_base64: imageBase64 } : { image_url: productUrl }),
      },
      duration_seconds: duration,
      aspect_ratio: aspectRatio,
      music_mood: String(form.get("music_mood") || "auto").trim() || "auto",
      visual_style: String(form.get("visual_style") || "auto").trim() || "auto",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110 * 1000);

    let externalRes;
    try {
      externalRes = await fetch(`${CGI_VIDEO_API_URL}/api/v1/ads`, {
        method: "POST",
        headers: { ...cgiVideoHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
