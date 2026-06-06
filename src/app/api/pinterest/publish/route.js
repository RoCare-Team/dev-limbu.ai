import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

// ─── Constants ────────────────────────────────────────────────────────────────

const PINTEREST_API = "https://api-sandbox.pinterest.com/v5";
// Switch to production: const PINTEREST_API = "https://api.pinterest.com/v5";

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 20;

// ─── Error helper ─────────────────────────────────────────────────────────────

function getPinterestErrorMessage(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  const message =
    data?.message ||
    data?.error?.message ||
    (typeof data?.error === "string" ? data.error : "") ||
    "";

  console.error("========== PINTEREST RAW ERROR ==========");
  console.error("Status:", status);
  console.error("Full Response:", JSON.stringify(data, null, 2));
  console.error("=========================================");

  if (status === 401) return "Pinterest session expired. Please reconnect your account.";
  if (status === 403 || /scope|permission|unauthorized/i.test(message))
    return "Pinterest pin create permission is missing. Please reconnect Pinterest and allow pin create access.";
  if (status === 429) return "Pinterest rate limit hit. Please try again in a few minutes.";

  return message || `Pinterest API Error (${status || "unknown"})`;
}

// ─── Step 1: Register video upload ───────────────────────────────────────────

async function registerVideoUpload(accessToken) {
  const response = await axios.post(
    `${PINTEREST_API}/media`,
    { media_type: "video" },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const { media_id, upload_url, upload_parameters } = response.data;

  if (!media_id || !upload_url || !upload_parameters) {
    throw new Error(
      `Pinterest register video response missing fields: ${JSON.stringify(response.data)}`
    );
  }

  // media_id MUST be a string of digits per Pinterest schema: { type: "string", pattern: "^\d+$" }
  const mediaIdStr = String(media_id);
  console.log("📋 Registered video. media_id:", mediaIdStr, "| upload_url:", upload_url);
  return { media_id: mediaIdStr, upload_url, upload_parameters };
}

// ─── Step 2: Upload video binary to S3 presigned URL ─────────────────────────

async function uploadVideoToS3(uploadUrl, uploadParameters, videoUrl) {
  console.log("⬇️  Fetching video from:", videoUrl);

  const videoResponse = await axios.get(videoUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
  });
  const videoBuffer = Buffer.from(videoResponse.data);
  console.log("📦 Video buffer size:", videoBuffer.length, "bytes");

  const FormData = (await import("form-data")).default;
  const form = new FormData();

  // Upload parameters MUST come before "file"
  for (const [key, value] of Object.entries(uploadParameters)) {
    form.append(key, value);
  }
  form.append("file", videoBuffer, {
    filename: "video.mp4",
    contentType: "video/mp4",
  });

  const s3Res = await axios.post(uploadUrl, form, {
    headers: { ...form.getHeaders() },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  });

  console.log("✅ S3 upload complete. HTTP status:", s3Res.status);
}

// ─── Step 3: Poll until Pinterest processes the video ─────────────────────────

async function waitForVideoProcessing(accessToken, mediaId, maxAttempts = POLL_MAX_ATTEMPTS) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${PINTEREST_API}/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const status = response.data.status;
    console.log(`⏳ Video processing attempt ${i + 1}/${maxAttempts}, status: ${status}`);

    if (status === "succeeded") return true;
    if (status === "failed") throw new Error("Pinterest video processing failed.");

    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
  }
  throw new Error("Pinterest video processing timed out.");
}

// ─── Cover image → base64 ─────────────────────────────────────────────────────

async function getCoverImageBase64(coverImageUrl) {
  const imageResponse = await axios.get(coverImageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  const base64Data = Buffer.from(imageResponse.data).toString("base64");

  const ext = (
    coverImageUrl.match(/\.(jpg|jpeg|png)(\?|$)/i)?.[1] || "jpeg"
  ).toLowerCase();

  // Pinterest only accepts image/jpeg or image/png for cover_image_content_type
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  return { base64Data, contentType };
}

// ─── Single pin POST ──────────────────────────────────────────────────────────

async function postPin(accessToken, payload) {
  return axios.post(`${PINTEREST_API}/pins`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

// ─── Video pin fallback chain (Corrected Nesting) ─────────────────────────────

async function createVideoPinWithFallback(accessToken, basePayload, coverImageUrl) {
  const isValidCover =
    !!coverImageUrl &&
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(coverImageUrl);

  // ── Attempt 0: cover_image_url as plain string inside media_source ──
  if (isValidCover) {
    try {
      console.log("🔗 Attempt 0: cover_image_url as plain string...");
      const payload = {
        ...basePayload,
        media_source: {
          ...basePayload.media_source,
          cover_image_url: coverImageUrl,
        },
      };
      console.log("📤 Payload (Attempt 0):", JSON.stringify(payload, null, 2));
      const res = await postPin(accessToken, payload);
      console.log("✅ Attempt 0 succeeded");
      return res.data;
    } catch (err) {
      console.warn("⚠️ Attempt 0 failed:", JSON.stringify(err.response?.data || err.message));
    }
  }

  // ── Attempt 1: base64 cover inside media_source ──
  if (isValidCover) {
    try {
      console.log("🖼️  Attempt 1: base64 cover image...");
      const { base64Data, contentType } = await getCoverImageBase64(coverImageUrl);
      const payload = {
        ...basePayload,
        media_source: {
          ...basePayload.media_source,
          cover_image_content_type: contentType,
          cover_image_data: base64Data,
        },
      };
      console.log(
        "📤 Payload (Attempt 1):",
        JSON.stringify(
          {
            ...payload,
            media_source: {
              ...payload.media_source,
              cover_image_data: "[BASE64_REDACTED]",
            },
          },
          null,
          2
        )
      );
      const res = await postPin(accessToken, payload);
      console.log("✅ Attempt 1 succeeded");
      return res.data;
    } catch (err) {
      console.warn("⚠️ Attempt 1 failed:", JSON.stringify(err.response?.data || err.message));
    }
  }

  // ── Attempt 2: keyframe integer 1 inside media_source ──
  try {
    console.log("🎞️  Attempt 2: cover_image_key_frame_time: 1 (integer)...");
    const payload = {
      ...basePayload,
      media_source: {
        ...basePayload.media_source,
        cover_image_key_frame_time: 1,
      },
    };
    console.log("📤 Payload (Attempt 2):", JSON.stringify(payload, null, 2));
    const res = await postPin(accessToken, payload);
    console.log("✅ Attempt 2 succeeded");
    return res.data;
  } catch (err) {
    console.warn("⚠️ Attempt 2 failed:", JSON.stringify(err.response?.data || err.message));
  }

  // ── Attempt 3: keyframe integer 0 inside media_source ──
  try {
    console.log("🎞️  Attempt 3: cover_image_key_frame_time: 0 (integer)...");
    const payload = {
      ...basePayload,
      media_source: {
        ...basePayload.media_source,
        cover_image_key_frame_time: 0,
      },
    };
    console.log("📤 Payload (Attempt 3):", JSON.stringify(payload, null, 2));
    const res = await postPin(accessToken, payload);
    console.log("✅ Attempt 3 succeeded");
    return res.data;
  } catch (err) {
    console.warn("⚠️ Attempt 3 failed:", JSON.stringify(err.response?.data || err.message));
  }

  // ── Attempt 4: no cover fields at all ──
  try {
    console.log("🚫 Attempt 4: no cover fields...");
    console.log("📤 Payload (Attempt 4):", JSON.stringify(basePayload, null, 2));
    const res = await postPin(accessToken, basePayload);
    console.log("✅ Attempt 4 succeeded");
    return res.data;
  } catch (err) {
    console.error("❌ All attempts failed. Last error:", JSON.stringify(err.response?.data || err.message));
    throw err;
  }
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, title, description, board_id, media_url, link, cover_image_url } = body;

    console.log("========== INCOMING REQUEST ==========");
    console.log(JSON.stringify({ userId, title, board_id, media_url, link, cover_image_url }, null, 2));
    console.log("======================================");

    if (!userId || !board_id || !media_url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, board_id, and media_url are required." },
        { status: 400 }
      );
    }

    const profile = await PinterestProfile.findOne({
      userId,
      "boards.boardId": board_id,
    });

    if (!profile?.accessToken) {
      return NextResponse.json(
        { success: false, error: "Pinterest account not connected or board not found." },
        { status: 404 }
      );
    }

    const isVideo = /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(media_url);

    console.log("========== MEDIA INFO ==========");
    console.log("Media URL:", media_url);
    console.log("Is Video:", isVideo);
    console.log("Cover Image URL:", cover_image_url || "(none)");
    console.log("================================");

    let pinData;

    if (isVideo) {
      console.log("🎬 Starting video pin flow...");

      // Step 1: Register
      const { media_id, upload_url, upload_parameters } =
        await registerVideoUpload(profile.accessToken);

      // Step 2: Upload
      await uploadVideoToS3(upload_url, upload_parameters, media_url);
      console.log("✅ Video uploaded to S3");

      // Step 3: Wait for processing
      await waitForVideoProcessing(profile.accessToken, media_id);
      console.log("✅ Video processing complete");

      // Step 4: Build base payload
      const basePayload = {
        board_id,
        title: title || "",
        description: description || "",
        ...(link ? { link } : {}),
        media_source: {
          source_type: "video_id",
          media_id: media_id,
        },
      };

      console.log("🔍 media_source:", JSON.stringify(basePayload.media_source));

      // Step 5: Try creating pin with cover fallback chain
      pinData = await createVideoPinWithFallback(
        profile.accessToken,
        basePayload,
        cover_image_url
      );
    } else {
      console.log("🖼️  Creating image pin...");

      const imagePayload = {
        board_id,
        title: title || "",
        description: description || "",
        ...(link ? { link } : {}),
        media_source: {
          source_type: "image_url",
          url: media_url,
        },
      };

      console.log("📤 Image pin payload:", JSON.stringify(imagePayload, null, 2));
      const response = await postPin(profile.accessToken, imagePayload);
      pinData = response.data;
    }

    console.log("✅ Pin created:", JSON.stringify(pinData, null, 2));

    return NextResponse.json({
      success: true,
      message: "Pin published successfully",
      pin: pinData,
    });
  } catch (error) {
    console.error("Pinterest Publish Error:", error.response?.data || error.message);
    const message = getPinterestErrorMessage(error);
    const status =
      error.response?.status === 401 ? 401
      : error.response?.status === 403 ? 403
      : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}