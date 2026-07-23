import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import User from "@/models/User";
import { gmbRedirectUri } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

function redirectBack(request, callbackUrl, params) {
  const url = new URL(callbackUrl || "/dashboard", request.url);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url);
}

/**
 * Google OAuth callback — Facebook/Instagram callbacks jaisa hi pattern.
 *
 * NextAuth involved nahi hai: yahan koi login session nahi banti, sirf ek
 * connected-account record likha jata hai. App login alag aur salamat rehta hai.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // State pehle decode karo taaki error par bhi sahi page par wapas bhej saken.
  let payload = null;
  try {
    payload = state ? jwt.verify(state, JWT_SECRET) : null;
  } catch {
    payload = null;
  }
  const callbackUrl = payload?.callbackUrl || "/dashboard";

  if (oauthError) {
    return redirectBack(request, callbackUrl, { gmb_error: oauthError });
  }
  if (!payload?.userId) {
    // State expire ya tampered — user dobara "Connect" dabaye. Auto-retry loop NAHI.
    return redirectBack(request, "/dashboard", { gmb_error: "invalid_state" });
  }
  if (!code) {
    return redirectBack(request, callbackUrl, { gmb_error: "missing_code" });
  }

  try {
    const { data: tokens } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: gmbRedirectUri(),
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { data: profile } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    await dbConnect();

    const existing = await GmbConnection.findOne({ userId: payload.userId });
    // Google re-consent par kabhi-kabhi refresh_token nahi bhejta — purana rakho.
    const refreshToken = tokens.refresh_token || existing?.refreshToken || null;

    if (!refreshToken) {
      return redirectBack(request, callbackUrl, { gmb_error: "no_refresh_token" });
    }

    const now = new Date();
    await GmbConnection.findOneAndUpdate(
      { userId: payload.userId },
      {
        $set: {
          userId: payload.userId,
          googleId: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          accessToken: tokens.access_token,
          refreshToken,
          accessTokenExpires: Date.now() + (tokens.expires_in || 3600) * 1000,
          scope: tokens.scope,
          updatedAt: now,
          invalid: false,
          invalidReason: null,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true, new: true },
    );

    // Legacy mirror: purane code paths (admin panel, login-as-user) abhi bhi
    // GmbUser.projects[] padhte hain, isliye dono jagah likhte hain.
    await syncLegacyGmbUser(payload.userId, profile, tokens, refreshToken, now);

    return redirectBack(request, callbackUrl, { gmb_connected: "1" });
  } catch (error) {
    console.error("[gmb/callback]", error.response?.data || error.message);
    return redirectBack(request, callbackUrl, { gmb_error: "token_exchange_failed" });
  }
}

/** Purane `GmbUser.projects[]` shape ko bhi update rakho (read-compat). */
async function syncLegacyGmbUser(userId, profile, tokens, refreshToken, now) {
  try {
    const appUser = await User.findOne({ userId }).lean();
    const email = appUser?.email || profile.email;
    if (!email) return;

    const rx = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const gmbUser = await GmbUser.findOne({ email: rx });
    const prevProjects = gmbUser?.projects || [];
    const prev = prevProjects.find((p) => p.googleId === profile.sub);

    const projects = [
      ...prevProjects.filter((p) => p.googleId !== profile.sub),
      {
        googleId: profile.sub,
        accessToken: tokens.access_token,
        refreshToken,
        createdAt: prev?.createdAt || now,
        updatedAt: now,
      },
    ];

    await GmbUser.findOneAndUpdate(
      { email: gmbUser?.email || email },
      {
        $set: {
          email: gmbUser?.email || email,
          name: profile.name,
          image: profile.picture,
          projects,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    // Legacy mirror best-effort hai — connect isse fail nahi hona chahiye.
    console.error("[gmb/callback] legacy GmbUser sync failed:", error.message);
  }
}
