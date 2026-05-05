import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";
import axios from "axios";
import FormData from "form-data";

async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const userId = formData.get("userId");
    const channelId = formData.get("channelId");
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const mediaUrl = formData.get("mediaUrl");
    const privacyStatus = formData.get("privacyStatus") || "public";
    const isShort = formData.get("isShort") === "true";

    if (!userId || !channelId || !title || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const channel = await YouTubeChannel.findOne({ userId, channelId });
    if (!channel) {
      return NextResponse.json(
        { success: false, error: "YouTube channel not found" },
        { status: 404 }
      );
    }

    let accessToken = channel.accessToken;

    if (
      !accessToken ||
      (channel.tokenExpiresAt && new Date(channel.tokenExpiresAt) <= new Date())
    ) {
      if (!channel.refreshToken) {
        return NextResponse.json(
          { success: false, error: "Reconnect YouTube account" },
          { status: 401 }
        );
      }
      const tokenData = await refreshAccessToken(channel.refreshToken);
      accessToken = tokenData.access_token;
      channel.accessToken = accessToken;
      channel.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      if (tokenData.refresh_token) channel.refreshToken = tokenData.refresh_token;
      await channel.save();
    }

    // ✅ Stream video from S3/URL
    const videoResponse = await axios({
      url: mediaUrl,
      method: "GET",
      responseType: "stream",
    });

    const videoContentType =
      videoResponse.headers["content-type"] || "video/mp4";

    // ✅ Build description with #shorts
    let finalDescription = description;
    if (isShort) {
      if (!finalDescription.toLowerCase().includes("#shorts")) {
        finalDescription += "\n#shorts";
      }
    }

    // ✅ Metadata — exactly matching Postman structure + Shorts fields
    const metadata = isShort
      ? {
          snippet: {
            title: title,
            description: finalDescription,
            tags: ["shorts", "Shorts", "#shorts", "#short", "shortvideo"],
            categoryId: "22",                 // ✅ People & Blogs (most Shorts use this)
            defaultLanguage: "en",
            defaultAudioLanguage: "en",
          },
          status: {
            privacyStatus: privacyStatus,
            selfDeclaredMadeForKids: false,   // ✅ Required for Shorts
            madeForKids: false,
          },
        }
      : {
          snippet: {
            title: title,
            description: finalDescription,
            tags: [],
            categoryId: "22",
          },
          status: {
            privacyStatus: privacyStatus,
            selfDeclaredMadeForKids: false,
            madeForKids: false,
          },
        };

    // ✅ Build multipart form-data exactly like Postman
    const form = new FormData();

    form.append("metadata", JSON.stringify(metadata), {
      contentType: "application/json; charset=UTF-8",
      filename: "metadata.json",
    });

    form.append("media", videoResponse.data, {
      contentType: videoContentType,
      filename: "video.mp4",
      knownLength: videoResponse.headers["content-length"]
        ? parseInt(videoResponse.headers["content-length"])
        : undefined,
    });

    // ✅ Upload to YouTube
    const uploadRes = await axios.post(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
      form,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return NextResponse.json({ success: true, data: uploadRes.data });
  } catch (error) {
    console.error("YouTube Upload Error:", error?.response?.data || error.message);

    if (error.response?.data) {
      return NextResponse.json(
        {
          success: false,
          error: error.response.data.error?.message || "Upload failed",
          details: error.response.data,
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}