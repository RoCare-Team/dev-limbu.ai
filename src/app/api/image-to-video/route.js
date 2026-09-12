import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { uploadToS3 } from "@/utils/s3Config";

// Video generation is slow — keep this route alive long enough for the
// upstream render (and override the platform's default function timeout).
export const maxDuration = 300; // seconds
export const dynamic = "force-dynamic";

const DEFAULT_IMAGE_TO_VIDEO_URL =
  "https://imgtovideo.limbutech.in/generate-video";

// Upstream fetch timeout (must stay below maxDuration so we can return a clean error)
const UPSTREAM_TIMEOUT_MS = 290000;

/** Coins charged after a successful image→video render (saved via Post + Transaction). */
const IMAGE_TO_VIDEO_COINS = 200;
// Fallback only — the caller's `duration` wins when it is one of the allowed lengths.
const IMAGE_TO_VIDEO_DURATION = 12;
const ALLOWED_IMAGE_TO_VIDEO_DURATIONS = [4, 6, 8, 10, 12, 15];
const IMAGE_TO_VIDEO_QUALITY = "720p";
const IMAGE_TO_VIDEO_RATIO = "9:16";

/**
 * Save video URL to Post, then deduct coins (same order as post-status + wallet rules).
 */
async function saveVideoToPostAndDeduct({
  userId,
  postId,
  videoUrl,
  apiPayload,
  effectivePrompt,
  videoPromptClient,
}) {
  await dbConnect();

  const ig =
    typeof apiPayload?.instagram_caption === "string"
      ? apiPayload.instagram_caption.trim()
      : "";
  const fb =
    typeof apiPayload?.facebook_caption === "string"
      ? apiPayload.facebook_caption.trim()
      : "";
  const description =
    [ig, fb].filter(Boolean).join("\n\n").trim() ||
    (typeof videoPromptClient === "string" && videoPromptClient.trim()) ||
    effectivePrompt ||
    "Video creative";
  const videoPrompt =
    typeof videoPromptClient === "string" && videoPromptClient.trim()
      ? videoPromptClient.trim()
      : effectivePrompt;

  const user = await User.findOne({ userId });
  if (!user) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const metaBase = {
    drive_link: videoUrl,
    job_id: apiPayload?.job_id ?? null,
  };

  if (
    postId &&
    typeof postId === "string" &&
    mongoose.Types.ObjectId.isValid(postId)
  ) {
    const existing = await Post.findOne({
      _id: new mongoose.Types.ObjectId(postId),
      userId,
    });
    if (!existing) {
      return { ok: false, status: 404, error: "Post not found" };
    }

    const existingVo = (existing.videoOutput || "").trim();
    if (existingVo === videoUrl) {
      return {
        ok: true,
        skipCharge: true,
        post: existing.toObject(),
        wallet: user.wallet,
        coinsDeducted: 0,
      };
    }

    if (user.wallet < IMAGE_TO_VIDEO_COINS) {
      return { ok: false, status: 402, error: "Insufficient balance" };
    }

    existing.set({
      videoOutput: videoUrl,
      videoPrompt,
      ...(fb ? { fbDescription: fb } : {}),
      ...(ig ? { igDescription: ig } : {}),
    });
    await existing.save();

    user.wallet -= IMAGE_TO_VIDEO_COINS;
    await user.save();

    await Transaction.create({
      userId,
      type: "debit",
      amount: IMAGE_TO_VIDEO_COINS,
      balanceAfter: user.wallet,
      reason: "video_generated",
      metadata: {
        ...metaBase,
        source: "image_to_video_merge",
        postId: String(existing._id),
      },
    });

    return {
      ok: true,
      post: existing.toObject(),
      wallet: user.wallet,
      coinsDeducted: IMAGE_TO_VIDEO_COINS,
    };
  }

  if (user.wallet < IMAGE_TO_VIDEO_COINS) {
    return { ok: false, status: 402, error: "Insufficient balance" };
  }

  const newPost = await Post.create({
    userId,
    aiOutput: videoUrl,
    description,
    promat: "Image to Video",
    status: "pending",
    mediaType: "video",
    gmbDescription: ig || description,
    fbDescription: fb || description,
    igDescription: ig || description,
    videoPrompt,
  });

  user.wallet -= IMAGE_TO_VIDEO_COINS;
  await user.save();

  await Transaction.create({
    userId,
    type: "debit",
    amount: IMAGE_TO_VIDEO_COINS,
    balanceAfter: user.wallet,
    reason: "video_generated",
    metadata: {
      ...metaBase,
      source: "image_to_video_new",
      postId: String(newPost._id),
    },
  });

  return {
    ok: true,
    post: newPost.toObject(),
    wallet: user.wallet,
    coinsDeducted: IMAGE_TO_VIDEO_COINS,
  };
}

/**
 * Proxies image-to-video generation. Accepts public image_url or base64/data URL
 * (uploaded to Cloudinary first so the external API gets a stable URL).
 * Optional: userId (+ postId to merge) — on success, saves via Post model and deducts 200 coins.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    let {
      image_url,
      image,
      prompt,
      platform,
      userId: bodyUserId,
      postId,
      video_prompt,
      duration: requestedDuration,
    } = body;

    const allowedPlatforms = ["instagram", "facebook", "both"];
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const trimmedVideoPrompt =
      typeof video_prompt === "string" ? video_prompt.trim() : "";
    const effectivePrompt =
      trimmedPrompt ||
      trimmedVideoPrompt ||
      "Create an engaging business promotional video.";

    const platformValue = typeof platform === "string" ? platform.trim() : "";
    if (platformValue && !allowedPlatforms.includes(platformValue)) {
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
          const base64Data = rawImage.split(',')[1];
          const mimeTypeMatch = rawImage.match(/^data:(image\/\w+);base64,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
          const extension = mimeType.split('/')[1] || "jpeg";
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `image-to-video-${Date.now()}.${extension}`;

          const uploadRes = await uploadToS3(buffer, fileName, mimeType);

          if (!uploadRes.success) {
            throw new Error(uploadRes.error);
          }
          finalImageUrl = uploadRes.url;
        } catch (err) {
          console.error("S3 upload (image-to-video):", err);
          return NextResponse.json(
            {
              success: false,
              error: "Failed to upload image for video generation.",
            },
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

    const upstreamUrl =
      process.env.IMAGE_TO_VIDEO_API_URL || DEFAULT_IMAGE_TO_VIDEO_URL;

    // The client used to send `duration` and it was silently dropped here — honour
    // it now, but only for lengths the UI actually offers.
    const durationNumber = Number(requestedDuration);
    const duration = ALLOWED_IMAGE_TO_VIDEO_DURATIONS.includes(durationNumber)
      ? durationNumber
      : IMAGE_TO_VIDEO_DURATION;

    const payload = {
      image_url: finalImageUrl,
      duration,
      quality: IMAGE_TO_VIDEO_QUALITY,
      ratio: IMAGE_TO_VIDEO_RATIO,
    };

    console.log("Image-to-video upstream payload:", payload);

    const upstreamController = new AbortController();
    const upstreamTimeout = setTimeout(
      () => upstreamController.abort(),
      UPSTREAM_TIMEOUT_MS
    );

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: upstreamController.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error: "Video generation timed out. Please try again.",
          },
          { status: 504 }
        );
      }
      throw err;
    } finally {
      clearTimeout(upstreamTimeout);
    }

    const text = await upstream.text();

    // console.log("UPSTREAM STATUS:", upstream.status);
// console.log("UPSTREAM RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // console.log("UPSTREAM PARSED RESPONSE:", data);

    if (!upstream.ok) {
      console.error("Image-to-video upstream error:", {
        status: upstream.status,
        response: data,
      });
      return NextResponse.json(
        { success: false, error: data?.error || data?.message || data },
        { status: upstream.status }
      );
    }

    const resolvedVideoUrl =
      (typeof data?.drive_link === "string" && data.drive_link.trim()) ||
      (typeof data?.video_url === "string" && data.video_url.trim()) ||
      (typeof data?.videoUrl === "string" && data.videoUrl.trim()) ||
      "";

    const normalizedResponse = {
      ...data,
      drive_link: resolvedVideoUrl || null,
      video_url: resolvedVideoUrl || null,
    };

    if (!resolvedVideoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "No video URL in generator response",
          ...normalizedResponse,
        },
        { status: 502 }
      );
    }

    const userId =
      typeof bodyUserId === "string" && bodyUserId.trim()
        ? bodyUserId.trim()
        : "";

    if (!userId) {
      return NextResponse.json(
        {
          success: true,
          ...normalizedResponse,
        },
        { status: 200 }
      );
    }

    const persist = await saveVideoToPostAndDeduct({
      userId,
      postId:
        typeof postId === "string" && postId.trim() ? postId.trim() : undefined,
      videoUrl: resolvedVideoUrl,
      apiPayload: data,
      effectivePrompt,
      videoPromptClient:
        typeof video_prompt === "string" ? video_prompt : "",
    });

    if (!persist.ok) {
      return NextResponse.json(
        {
          success: false,
          error: persist.error,
          ...normalizedResponse,
        },
        { status: persist.status || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...normalizedResponse,
        post: persist.post,
        wallet: persist.wallet,
        coinsDeducted: persist.coinsDeducted,
        alreadySaved: !!persist.skipCharge,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("image-to-video API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
