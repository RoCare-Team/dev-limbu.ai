import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

const PINTEREST_API = "https://api-sandbox.pinterest.com/v5";

function getPinterestPublishErrorMessage(error) {
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

  if (status === 401)
    return "Pinterest session expired. Please reconnect your account.";
  if (status === 403 || /scope|permission|unauthorized/i.test(message)) {
    return "Pinterest pin create permission is missing. Please reconnect Pinterest and allow pin create access.";
  }

  return message || `Pinterest API Error (${status || "unknown"})`;
}

async function registerVideoUpload(accessToken) {
  const response = await axios.post(
    `${PINTEREST_API}/media`,
    { media_type: "video" },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  console.log(
    "📋 Register video upload response:",
    JSON.stringify(response.data, null, 2),
  );
  return response.data;
}

async function uploadVideoToS3(uploadUrl, uploadParameters, videoUrl) {
  const videoResponse = await axios.get(videoUrl, {
    responseType: "arraybuffer",
  });
  const videoBuffer = Buffer.from(videoResponse.data);

  const FormData = (await import("form-data")).default;
  const form = new FormData();

  for (const [key, value] of Object.entries(uploadParameters)) {
    form.append(key, value);
  }
  form.append("file", videoBuffer, {
    filename: "video.mp4",
    contentType: "video/mp4",
  });

  await axios.post(uploadUrl, form, {
    headers: { ...form.getHeaders() },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
}

async function waitForVideoProcessing(accessToken, mediaId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${PINTEREST_API}/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const status = response.data.status;
    console.log(
      `⏳ Video processing attempt ${i + 1}/${maxAttempts}, status: ${status}`,
    );

    if (status === "succeeded") return true;
    if (status === "failed")
      throw new Error("Pinterest video processing failed.");

    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error("Pinterest video processing timed out.");
}

// ✅ Cover image ko base64 mein convert karna
async function getCoverImageBase64(coverImageUrl) {
  const imageResponse = await axios.get(coverImageUrl, {
    responseType: "arraybuffer",
  });
  const base64Data = Buffer.from(imageResponse.data).toString("base64");

  const ext = (
    coverImageUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] || "jpeg"
  ).toLowerCase();
  const contentTypeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const contentType = contentTypeMap[ext] || "image/jpeg";

  return { base64Data, contentType };
}

// ✅ Pin create karna with fallback chain
async function createPinWithFallback(accessToken, basePayload, coverImageUrl) {
  const isValidImageCover =
    !!coverImageUrl && /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(coverImageUrl);

  // ── Attempt 1: base64 cover image ──
  if (isValidImageCover) {
    try {
      console.log("🖼️ Attempt 1: Trying base64 cover image...");
      const { base64Data, contentType } =
        await getCoverImageBase64(coverImageUrl);

      const payload = {
        ...basePayload,
        cover_image_content_type: contentType,
        cover_image_data: base64Data,
      };

      console.log(
        "📤 Payload (Attempt 1 - base64):",
        JSON.stringify(
          {
            ...payload,
            cover_image_data: "[BASE64]",
          },
          null,
          2,
        ),
      );

      const response = await axios.post(`${PINTEREST_API}/pins`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Attempt 1 succeeded (base64 cover)");
      return response.data;
    } catch (err) {
      console.warn(
        "⚠️ Attempt 1 failed (base64):",
        JSON.stringify(err.response?.data || err.message),
      );
    }
  }

  // ── Attempt 2: cover_image_key_frame_time as float ──
  try {
    console.log("🎞️ Attempt 2: Trying cover_image_key_frame_time: 1.0...");
    const payload = {
      ...basePayload,
      cover_image_key_frame_time: 1.0,
    };

    console.log(
      "📤 Payload (Attempt 2 - keyframe 1.0):",
      JSON.stringify(payload, null, 2),
    );

    const response = await axios.post(`${PINTEREST_API}/pins`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Attempt 2 succeeded (keyframe 1.0)");
    return response.data;
  } catch (err) {
    console.warn(
      "⚠️ Attempt 2 failed (keyframe 1.0):",
      JSON.stringify(err.response?.data || err.message),
    );
  }

  // ── Attempt 3: cover_image_key_frame_time: 0 as number ──
  try {
    console.log("🎞️ Attempt 3: Trying cover_image_key_frame_time: 0...");
    const payload = {
      ...basePayload,
      cover_image_key_frame_time: 0,
    };

    console.log(
      "📤 Payload (Attempt 3 - keyframe 0):",
      JSON.stringify(payload, null, 2),
    );

    const response = await axios.post(`${PINTEREST_API}/pins`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Attempt 3 succeeded (keyframe 0)");
    return response.data;
  } catch (err) {
    console.warn(
      "⚠️ Attempt 3 failed (keyframe 0):",
      JSON.stringify(err.response?.data || err.message),
    );
  }

  // ── Attempt 4: cover fields bilkul nahi bhejna ──
  try {
    console.log("🚫 Attempt 4: Trying without any cover image field...");
    console.log(
      "📤 Payload (Attempt 4 - no cover):",
      JSON.stringify(basePayload, null, 2),
    );

    const response = await axios.post(`${PINTEREST_API}/pins`, basePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Attempt 4 succeeded (no cover)");
    return response.data;
  } catch (err) {
    console.error(
      "❌ Attempt 4 also failed:",
      JSON.stringify(err.response?.data || err.message),
    );
    // Last attempt ka error throw karo
    throw err;
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      userId,
      title,
      description,
      board_id,
      media_url,
      link,
      cover_image_url,
    } = body;

    console.log("========== INCOMING REQUEST ==========");
    console.log(
      JSON.stringify(
        { userId, title, board_id, media_url, link, cover_image_url },
        null,
        2,
      ),
    );
    console.log("======================================");

    if (!userId || !board_id || !media_url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: userId, board_id, and media_url are required.",
        },
        { status: 400 },
      );
    }

    const profile = await PinterestProfile.findOne({
      userId,
      "boards.boardId": board_id,
    });

    if (!profile || !profile.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Pinterest account not connected or board not found.",
        },
        { status: 404 },
      );
    }

    const isVideo = /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(media_url);

    console.log("========== PINTEREST MEDIA ==========");
    console.log("Media URL:", media_url);
    console.log("Is Video:", isVideo);
    console.log("Cover Image URL:", cover_image_url);
    console.log("====================================");

    let mediaSource;

    if (isVideo) {
      console.log("🎬 Starting Pinterest video upload flow...");

      const { media_id, upload_url, upload_parameters } =
        await registerVideoUpload(profile.accessToken);
      console.log("✅ media_id:", media_id);

      await uploadVideoToS3(upload_url, upload_parameters, media_url);
      console.log("✅ Video uploaded to S3");

      await waitForVideoProcessing(profile.accessToken, media_id);
      console.log("✅ Video processing complete");

      mediaSource = {
        source_type: "video_id",
        media_id: String(media_id),
      };
    } else {
      mediaSource = {
        source_type: "image_url",
        url: media_url,
      };
    }

    // ✅ Base payload — cover fields nahi hain abhi
    const basePayload = {
      board_id,
      media_source: mediaSource,
      title: title || "",
      description: description || "",
    };

    if (link) basePayload.link = link;

    let pinData;

    if (isVideo) {
      // ✅ Fallback chain se try karo
      pinData = await createPinWithFallback(
        profile.accessToken,
        basePayload,
        cover_image_url,
      );
    } else {
      // Image pin — seedha post karo
      const response = await axios.post(`${PINTEREST_API}/pins`, basePayload, {
        headers: {
          Authorization: `Bearer ${profile.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      pinData = response.data;
    }

    console.log("✅ Pin created:", JSON.stringify(pinData, null, 2));

    return NextResponse.json({
      success: true,
      message: "Pin published successfully",
      pin: pinData,
    });
  } catch (error) {
    console.error(
      "Pinterest Publish Error:",
      error.response?.data || error.message,
    );
    const message = getPinterestPublishErrorMessage(error);
    const status =
      error.response?.status === 401
        ? 401
        : error.response?.status === 403
          ? 403
          : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
