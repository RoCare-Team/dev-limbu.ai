import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";
import { getBaseUrl } from "@/utils/urlHelper";

export async function GET(req) {
  // console.log("👉 YouTube Callback Hit");

  try {
    await dbConnect();
    console.log("✅ DB Connected");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/youtube/callback`;

    let userId = stateParam;
    let isMobile = false;

    try {
      if (stateParam) {
        const decodedState = JSON.parse(decodeURIComponent(stateParam));
        userId = decodedState.userId;
        isMobile = decodedState.mobile === true;
      }
    } catch (e) {
      userId = stateParam;
    }

    console.log("📥 Received Params:", { code, userId });

    if (!code || !userId) {
      console.log("❌ Missing code or userId");
      if (isMobile) {
        return NextResponse.redirect(
          "limbuai://youtube-error?error=missing_params"
        );
      }
      return NextResponse.redirect(
        `${baseUrl}/dashboard?youtube=missing_params`
      );
    }

    /* ---------------------------------------------
       1️⃣ EXCHANGE CODE FOR TOKENS
    --------------------------------------------- */
    console.log("🔄 Exchanging code for token...");

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Token Response:", tokenRes.data);

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;
    const expiresIn = tokenRes.data.expires_in;

    if (!accessToken) {
      console.log("❌ Access token missing");
      throw new Error("No access token received");
    }

    const tokenExpiryDate = new Date(Date.now() + expiresIn * 1000);

    console.log("🔑 Access Token:", accessToken);
    console.log("🔄 Refresh Token:", refreshToken);

    /* ---------------------------------------------
       2️⃣ FETCH YOUTUBE CHANNELS
    --------------------------------------------- */
    console.log("📺 Fetching YouTube channels...");

    const channelsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          part: "id,snippet",
          mine: true,
        },
      }
    );

    console.log("✅ Channels Response:", channelsRes.data);

    const channels = channelsRes.data.items;

    if (!channels || channels.length === 0) {
      console.log("❌ No channels found");
      if (isMobile) {
        return NextResponse.redirect(
          "limbuai://youtube-error?error=no_channels"
        );
      }
      return NextResponse.redirect(
        `${baseUrl}/dashboard?youtube=no_channels`
      );
    }

    /* ---------------------------------------------
       3️⃣ SAVE TOKENS + CHANNEL INFO
    --------------------------------------------- */
    console.log("💾 Saving channels to DB...");

    for (const channel of channels) {
      console.log("➡️ Saving channel:", channel.id);

      await YouTubeChannel.findOneAndUpdate(
        { userId, channelId: channel.id },
        {
          userId,
          channelId: channel.id,
          channelTitle: channel.snippet.title,
          accessToken,
          refreshToken,
          tokenExpiresAt: tokenExpiryDate,
          platform: "youtube",
        },
        { upsert: true, new: true }
      );
    }

    console.log("🎉 YouTube Connected Successfully");

    if (isMobile) {
      return NextResponse.redirect(
        "limbuai://youtube-success?status=connected"
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard?youtube=connected`
    );

  } catch (err) {
    console.error("🔥 YOUTUBE CALLBACK ERROR:");
    console.error("Message:", err.message);
    console.error("Response:", err.response?.data);
    const baseUrl = getBaseUrl(req);

    const stateParam = new URL(req.url).searchParams.get("state");
    let isMobile = false;
    try {
      const decodedState = JSON.parse(decodeURIComponent(stateParam));
      isMobile = decodedState.mobile === true;
    } catch (e) {}

    if (isMobile) {
      return NextResponse.redirect("limbuai://youtube-error?error=unknown");
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard?youtube=error`
    );
  }
}
