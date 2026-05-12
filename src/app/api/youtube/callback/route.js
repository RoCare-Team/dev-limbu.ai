import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";
import {
  parseYoutubeLinkedinOAuthState,
  youtubeSuccessRedirect,
  youtubeErrorRedirect,
} from "@/lib/chatbotPlatformOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const baseUrl = resolveOAuthRedirectOrigin(req);
    const redirectUri = `${baseUrl}/api/youtube/callback`;

    const parsed = parseYoutubeLinkedinOAuthState(stateParam);
    const userId = parsed.userId;
    const isMobile = parsed.mobile;

    if (!code || !userId) {
      if (isMobile) {
        return NextResponse.redirect("limbuai://youtube-error?error=missing_params");
      }
      return NextResponse.redirect(youtubeErrorRedirect(parsed, "missing_params", baseUrl));
    }

    const connectionSource = parsed.source === "chatbot" ? "chatbot" : "manual";
    const tagPhone = parsed.source === "chatbot" && parsed.phone ? parsed.phone : "";

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

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;
    const expiresIn = tokenRes.data.expires_in;

    if (!accessToken) {
      throw new Error("No access token received");
    }

    const tokenExpiryDate = new Date(Date.now() + (expiresIn || 3600) * 1000);

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

    const channels = channelsRes.data.items;

    if (!channels || channels.length === 0) {
      if (isMobile) {
        return NextResponse.redirect("limbuai://youtube-error?error=no_channels");
      }
      return NextResponse.redirect(youtubeErrorRedirect(parsed, "no_channels", baseUrl));
    }

    for (const channel of channels) {
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
          connectionSource,
          ...(tagPhone ? { phone: tagPhone } : {}),
        },
        { upsert: true, new: true }
      );
    }

    if (parsed.source === "chatbot" && parsed.phone) {
      await YouTubeChannel.updateMany(
        { userId, channelId: { $in: channels.map((c) => c.id) } },
        { $set: { phone: parsed.phone, connectionSource: "chatbot" } }
      );
    }

    if (isMobile) {
      return NextResponse.redirect("limbuai://youtube-success?status=connected");
    }

    return NextResponse.redirect(youtubeSuccessRedirect(parsed, baseUrl));
  } catch (err) {
    console.error("YOUTUBE CALLBACK ERROR:", err.response?.data || err.message);
    const baseUrl = resolveOAuthRedirectOrigin(req);
    const stateParam = new URL(req.url).searchParams.get("state");
    const parsed = parseYoutubeLinkedinOAuthState(stateParam);
    const isMobile = parsed.mobile;

    if (isMobile) {
      return NextResponse.redirect("limbuai://youtube-error?error=unknown");
    }

    return NextResponse.redirect(youtubeErrorRedirect(parsed, "oauth_failed", baseUrl));
  }
}
