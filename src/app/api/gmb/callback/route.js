import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import User from "@/models/User";
import {
  gmbRedirectUri,
  GMB_BASE_URL,
  resolveGmbOwnerId,
  findRefreshTokenByGoogleId,
  convergeGoogleAccountToken,
  hasBusinessManageScope,
} from "@/lib/gmbSession";
import { createGmbPhoneToken, gmbPhoneCookieOptions } from "@/lib/appSession";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/**
 * Base hamesha GMB_BASE_URL (default https://limbu.ai) hai, `request.url` nahi —
 * reverse proxy ke peeche `request.url` localhost:3000 hota tha, jiski wajah se
 * live par connect karne ke baad localhost par redirect ho jata tha.
 */
function redirectBack(request, callbackUrl, params) {
  // Absolute URL aaye to bhi sirf uska path/query lete hain — host hamesha
  // GMB_BASE_URL rehta hai (localhost leak aur open-redirect dono band).
  let target = "/dashboard";
  try {
    const parsed = new URL(callbackUrl || "/dashboard", GMB_BASE_URL);
    target = `${parsed.pathname}${parsed.search}`;
  } catch {
    target = "/dashboard";
  }

  const url = new URL(target, GMB_BASE_URL);
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
  // State me ya to app ka userId hota hai, ya chatbot flow ka phone.
  if (!payload?.userId && !payload?.phone) {
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

    // Chatbot flow me key phone se aati hai — agar us phone ka asli User mil
    // jaye to uske userId par hi store hota hai, warna `phone:<digits>`.
    const phone = payload.phone || null;
    const ownerId = payload.userId || (await resolveGmbOwnerId(phone));

    // Impersonated (in-house login-as-user, manager-access Google account) se
    // connect hua to alag slot — taaki client ke apne connection ko kabhi
    // OVERWRITE na kare (aur ulta bhi nahi). Dekho: models/GmbConnection.js
    const connectedBy = phone ? "self" : (payload.impersonated ? "admin_impersonation" : "self");

    // ── SCOPE GATE ──────────────────────────────────────────────────────────
    // Google ke consent screen par har scope ka apna checkbox hota hai. User
    // "…your Google Business Profile" wala box untick kar de to login to ho
    // jata hai, par token me `business.manage` nahi aata — aur har GBP call
    // 403 "ACCESS_TOKEN_SCOPE_INSUFFICIENT" deti hai, jabki dashboard "connected"
    // dikhata hai. Production me 269 me se 51 connections aise hi bane the.
    //
    // Isliye aisa grant SAVE hi nahi karte: ek baar `prompt=consent` ke saath
    // wapas bhejte hain taaki user permission tick kar sake, aur phir bhi na ho
    // to saaf error dikhate hain.
    if (!hasBusinessManageScope(tokens.scope)) {
      console.warn(
        `[gmb/callback] granted scope me business.manage nahi — owner=${ownerId} scope="${tokens.scope}"`,
      );
      if (!payload.retried) {
        const retryUrl = new URL("/api/gmb/connect", GMB_BASE_URL);
        retryUrl.searchParams.set("consent", "1");
        retryUrl.searchParams.set("retried", "1");
        retryUrl.searchParams.set("callbackUrl", callbackUrl);
        if (payload.phone) retryUrl.searchParams.set("phone", payload.phone);
        return NextResponse.redirect(retryUrl);
      }
      return redirectBack(request, callbackUrl, { gmb_error: "scope_missing" });
    }

    const existing = await GmbConnection.findOne({ userId: ownerId, connectedBy });

    // Google pehle se granted account par refresh_token nahi bhejta. Aise me
    // naya token mint karna (prompt=consent) sirf nuksan karta hai: ek Google
    // account + ek client par sirf 100 live refresh token hote hain, aur limit
    // cross hote hi Google sabse purana chupchap revoke kar deta hai — wahi
    // "1-2 din baad token dead" wali dikkat thi.
    //
    // Isliye order: naya token (agar mila) → is slot ka purana → USI Google
    // account ki doosri row (kisi bhi user/slot) ka zinda token.
    //
    // Purana token TABHI reuse hota hai jab uske grant me bhi business.manage
    // tha. Warna ek login-only token adopt ho jata tha aur user "connected"
    // dikhne ke bawajood har GBP call par 403 khaata tha.
    const reusableExisting =
      existing?.refreshToken && hasBusinessManageScope(existing.scope ?? tokens.scope)
        ? existing.refreshToken
        : null;
    const refreshToken =
      tokens.refresh_token ||
      reusableExisting ||
      (await findRefreshTokenByGoogleId(profile.sub, { excludeUserId: ownerId })) ||
      null;

    if (!refreshToken) {
      // Ek hi baar consent force karke dobara bhejo — tab Google pakka refresh
      // token deta hai. `retried` flag loop rokta hai.
      if (!payload.retried) {
        const retryUrl = new URL("/api/gmb/connect", GMB_BASE_URL);
        retryUrl.searchParams.set("consent", "1");
        retryUrl.searchParams.set("retried", "1");
        retryUrl.searchParams.set("callbackUrl", callbackUrl);
        if (payload.phone) retryUrl.searchParams.set("phone", payload.phone);
        return NextResponse.redirect(retryUrl);
      }
      return redirectBack(request, callbackUrl, { gmb_error: "no_refresh_token" });
    }

    const now = new Date();
    await GmbConnection.findOneAndUpdate(
      { userId: ownerId, connectedBy },
      {
        $set: {
          userId: ownerId,
          connectedBy,
          ...(phone ? { phone } : {}),
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

    // Naya token mila to usi Google account ke baaki connections ko bhi ispar
    // shift kar do — warna wo purane token pakde rehte hain jo Google kabhi bhi
    // prune kar sakta hai.
    // Scope pass karte hain taaki ek login-only token galti se poore Google
    // account ke saare connections par na phail jaye.
    if (tokens.refresh_token) {
      await convergeGoogleAccountToken(profile.sub, refreshToken, tokens.scope);
    }

    // Legacy mirror: purane code paths (admin panel, login-as-user) abhi bhi
    // GmbUser.projects[] padhte hain, isliye dono jagah likhte hain.
    await syncLegacyGmbUser(ownerId, profile, tokens, refreshToken, now);

    const response = redirectBack(request, callbackUrl, { gmb_connected: "1" });

    // Chatbot user app me logged in nahi hai. Use GMB-only, short-lived cookie
    // do taaki wapas aakar my-locations / sync-and-save call kar sake.
    if (phone) {
      response.cookies.set({
        ...gmbPhoneCookieOptions(),
        value: createGmbPhoneToken(phone),
      });
    }

    return response;
  } catch (error) {
    console.error("[gmb/callback]", error.response?.data || error.message);
    // `token_exchange_failed` sirf tab bolo jab galti sach me Google ke token
    // exchange me hui ho — DB save (duplicate-key, validation, etc.) alag
    // error code se dikhao, warna debugging me sab kuch "token exchange" lagta
    // hai jabki asli wajah kuch aur hoti hai (jaise purana DB unique index).
    const isTokenExchange = error.config?.url?.includes("oauth2.googleapis.com/token");
    const code = isTokenExchange
      ? "token_exchange_failed"
      : error.code === 11000
        ? "duplicate_connection"
        : "callback_failed";
    return redirectBack(request, callbackUrl, { gmb_error: code });
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
