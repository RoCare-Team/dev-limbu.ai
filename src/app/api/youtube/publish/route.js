import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";
import axios from "axios";
import FormData from "form-data";

/**
 * 🔄 Refresh Access Token
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
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

    // 🔍 Channel fetch
    const channel = await YouTubeChannel.findOne({ userId, channelId });

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "YouTube channel not found" },
        { status: 404 }
      );
    }

    let accessToken = channel.accessToken;

    // 🔄 Refresh token if expired
    if (
      !accessToken ||
      (channel.tokenExpiresAt &&
        new Date(channel.tokenExpiresAt) <= new Date())
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
      channel.tokenExpiresAt = new Date(
        Date.now() + tokenData.expires_in * 1000
      );

      if (tokenData.refresh_token) {
        channel.refreshToken = tokenData.refresh_token;
      }

      await channel.save();
    }

    /**
     * 🎥 STREAM VIDEO FROM S3 (IMPORTANT)
     */
    const videoResponse = await axios({
      url: mediaUrl,
      method: "GET",
      responseType: "stream",
    });

    /**
     * 🧠 Metadata (same as cURL)
     */
    let finalDescription = description;

    if (isShort && !finalDescription.toLowerCase().includes("#shorts")) {
      finalDescription += "\n#shorts";
    }

    const metadata = {
      snippet: {
        title: title,
        description: finalDescription,
        tags: ["shorts"],
      },
      status: {
        privacyStatus: privacyStatus,
      },
    };

    /**
     * 📦 FORM-DATA (exact cURL replica)
     */
    const form = new FormData();

    form.append("metadata", JSON.stringify(metadata), {
      contentType: "application/json",
    });

    form.append("media", videoResponse.data);

    /**
     * 🚀 YouTube Upload (same as cURL)
     */
    const uploadRes = await axios.post(
      "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status",
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

    return NextResponse.json({
      success: true,
      data: uploadRes.data,
    });
  } catch (error) {
    console.error("YouTube Upload Error:", error);

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
      {
        success: false,
        error: error.message || "Internal error",
      },
      { status: 500 }
    );
  }
}