import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_IMAGE_TO_VIDEO_URL =
  "https://imgtovideo.limbutech.in/generate-video";

/**
 * Proxies image-to-video generation. Accepts public image_url or base64/data URL
 * (uploaded to Cloudinary first so the external API gets a stable URL).
 */
export async function POST(req) {
  try {
    const body = await req.json();
    let {
      image_url,
      image,
      prompt,
      business_name,
      duration,
      audio_folder,
      audio_file_url,
      platform,
    } = body;

    const allowedDurations = [5, 8, 10];
    const allowedPlatforms = ["instagram", "facebook", "both"];
    const allowedAudioFolders = ["dharmik", "motivational", "basic"];
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const effectivePrompt = trimmedPrompt || "Create an engaging business promotional video.";

    const d = Number(duration);
    if (!Number.isFinite(d) || !allowedDurations.includes(d)) {
      return NextResponse.json(
        { success: false, error: "duration must be one of 5, 8, or 10" },
        { status: 400 }
      );
    }

    const platformValue = typeof platform === "string" ? platform.trim() : "";
    if (!allowedPlatforms.includes(platformValue)) {
      return NextResponse.json(
        {
          success: false,
          error: "platform must be one of instagram, facebook, or both",
        },
        { status: 400 }
      );
    }

    let finalImageUrl =
      typeof image_url === "string" && image_url.startsWith("http")
        ? image_url.trim()
        : "";

    const rawImage =
      typeof image === "string" && image.trim() ? image.trim() : "";

    if (!finalImageUrl && rawImage) {
      if (rawImage.startsWith("data:image")) {
        try {
          const uploadRes = await cloudinary.uploader.upload(rawImage, {
            folder: "image-to-video",
            resource_type: "image",
          });
          finalImageUrl = uploadRes.secure_url;
        } catch (err) {
          console.error("Cloudinary upload (image-to-video):", err);
          return NextResponse.json(
            { success: false, error: "Failed to upload image for video generation." },
            { status: 400 }
          );
        }
      } else if (rawImage.startsWith("http")) {
        finalImageUrl = rawImage;
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid image is required (HTTPS image_url or a base64/data URL in image).",
        },
        { status: 400 }
      );
    }

    const name =
      typeof business_name === "string" && business_name.trim()
        ? business_name.trim()
        : "Business";
    const trimmedAudioFileUrl =
      typeof audio_file_url === "string" ? audio_file_url.trim() : "";
    const trimmedAudioFolder =
      typeof audio_folder === "string" ? audio_folder.trim() : "";

    if (trimmedAudioFolder && !allowedAudioFolders.includes(trimmedAudioFolder)) {
      return NextResponse.json(
        {
          success: false,
          error: "audio_folder must be one of dharmik, motivational, or basic",
        },
        { status: 400 }
      );
    }

    const upstreamUrl =
      process.env.IMAGE_TO_VIDEO_API_URL || DEFAULT_IMAGE_TO_VIDEO_URL;

    const payload = {
      image_url: finalImageUrl,
      prompt: effectivePrompt,
      business_name: name,
      duration: d,
      platform: platformValue,
    };
    if (trimmedAudioFileUrl) {
      payload.audio_file_url = trimmedAudioFileUrl;
    } else if (trimmedAudioFolder) {
      payload.audio_folder = trimmedAudioFolder;
    }

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || data?.message || data },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("image-to-video API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
