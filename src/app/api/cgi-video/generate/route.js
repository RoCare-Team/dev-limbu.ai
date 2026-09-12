import { NextResponse } from "next/server";
import {
  CGI_VIDEO_API_URL,
  cgiVideoHeaders,
  readUpstreamJson,
  upstreamErrorMessage,
} from "@/lib/cgiVideoApi";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const OPTIONAL_TEXT_FIELDS = ["product_name", "keywords", "music_mood"];

// The upstream returns as soon as the ad copy is written and the video job is
// submitted (not when the video is done), so a couple of minutes is plenty.
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
    const incomingForm = await req.formData();

    const businessName = String(incomingForm.get("business_name") || "").trim();
    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "business_name is required." },
        { status: 400 }
      );
    }

    const product = incomingForm.get("product");
    if (!isFile(product)) {
      return NextResponse.json(
        { success: false, error: "A product image is required." },
        { status: 400 }
      );
    }
    const productErr = imageError(product, "Product image");
    if (productErr) {
      return NextResponse.json({ success: false, error: productErr }, { status: 400 });
    }

    const forwardForm = new FormData();
    forwardForm.append("business_name", businessName);
    forwardForm.append("product", product, product.name);

    const logo = incomingForm.get("logo");
    if (isFile(logo)) {
      const logoErr = imageError(logo, "Logo");
      if (logoErr) {
        return NextResponse.json({ success: false, error: logoErr }, { status: 400 });
      }
      forwardForm.append("logo", logo, logo.name);
    }

    for (const field of OPTIONAL_TEXT_FIELDS) {
      const value = String(incomingForm.get(field) || "").trim();
      if (value) forwardForm.append(field, value);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 170 * 1000);

    let externalRes;
    try {
      // No Content-Type header: fetch sets multipart/form-data with the boundary itself.
      externalRes = await fetch(`${CGI_VIDEO_API_URL}/api/generate-ad`, {
        method: "POST",
        headers: cgiVideoHeaders(),
        body: forwardForm,
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
