import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GoogleBusinessProfile from "@/models/GoogleBusinessProfile";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";
import {
  gmbErrorRedirect,
  gmbSuccessRedirect,
  parseGmbOAuthState,
} from "@/lib/gmbOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

async function exchangeCodeForToken({ code, redirectUri }) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  return response.data;
}

async function fetchGoogleUser(accessToken) {
  const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
}

export async function GET(req) {
  const baseUrl = "http://localhost:3000";
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state");
  const parsed = parseGmbOAuthState(rawState);
  const userId = parsed.userId;
  const isMobile = parsed.mobile === true || parsed.mobile === "true";

  if (!code || !userId) {
    if (isMobile) return NextResponse.redirect("limbuai://gmb-error?error=missing_params");
    return NextResponse.redirect(gmbErrorRedirect(parsed, "missing_params", baseUrl));
  }

  try {
    await dbConnect();

    const redirectUri = `${baseUrl}/api/gmb/callback`;
    const tokenData = await exchangeCodeForToken({ code, redirectUri });
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const googleUser = await fetchGoogleUser(accessToken);
    const listings = await fetchAllUserGmbListings(accessToken);
    const chatbotFields =
      parsed.phone && parsed.source === "chatbot"
        ? { phone: parsed.phone, connectionSource: "chatbot" }
        : {};

    const previous = await GoogleBusinessProfile.findOne({
      userId,
      googleId: googleUser.sub,
    });

    await GoogleBusinessProfile.findOneAndUpdate(
      { userId, googleId: googleUser.sub },
      {
        $set: {
          userId,
          googleId: googleUser.sub,
          email: googleUser.email || "",
          name: googleUser.name || "",
          image: googleUser.picture || "",
          accessToken,
          refreshToken: refreshToken || previous?.refreshToken || "",
          tokenExpiresAt,
          listings,
          platform: "gmb",
          type: "google_business",
          ...chatbotFields,
        },
      },
      { upsert: true, new: true },
    );

    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://gmb-success?status=connected&userId=${encodeURIComponent(userId)}`,
      );
    }

    return NextResponse.redirect(gmbSuccessRedirect(parsed, baseUrl));
  } catch (error) {
    console.error("GMB Callback Error:", error.response?.data || error.message);
    if (isMobile) return NextResponse.redirect("limbuai://gmb-error?error=oauth_failed");
    return NextResponse.redirect(gmbErrorRedirect(parsed, "oauth_failed", baseUrl));
  }
}
