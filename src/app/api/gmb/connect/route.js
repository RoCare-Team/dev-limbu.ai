import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAppUser } from "@/lib/appSession";
import { GMB_SCOPE, gmbRedirectUri, GMB_BASE_URL } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/**
 * Google consent URL banata hai.
 *
 * NextAuth se farak: CSRF state ek **signed JWT** hai jo URL me travel karta hai,
 * cookie me nahi. Isiliye `error=OAuthCallback` (state-cookie mismatch) wala
 * loop yahan ho hi nahi sakta — reverse proxy / subdomain par bhi nahi.
 */
function buildAuthUrl(identity, callbackUrl, forceConsent) {
  const state = jwt.sign({ ...identity, callbackUrl }, JWT_SECRET, {
    expiresIn: "10m",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: gmbRedirectUri(),
    response_type: "code",
    scope: GMB_SCOPE,
    access_type: "offline",
    // `include_granted_scopes` jaan-boojhkar NAHI: wo is account ko pehle diye
    // gaye saare scopes (YouTube, Drive) is request me mila deta tha, aur Google
    // YouTube scopes ko dusre scopes ke saath grant nahi karta —
    // "scopes that cannot be requested together" (Error 400: invalid_request).
    // GMB ko sirf business.manage chahiye, incremental auth ki zaroorat nahi.
    state,
  });
  // Consent sirf tab jab refresh token chahiye — har baar nahi.
  if (forceConsent) params.set("prompt", "consent");

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function resolve(request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  // Pehla connect / reconnect — dono me refresh token chahiye.
  const forceConsent = searchParams.get("consent") !== "0";

  const appUser = getAppUser(request);
  if (appUser?.userId) {
    return {
      url: buildAuthUrl({ userId: appUser.userId }, callbackUrl, forceConsent),
    };
  }

  // WhatsApp chatbot flow: user app me logged in nahi hai, sirf phone hai.
  // Ye wahi identifier hai jispar ye poora flow pehle se chalta hai
  // (check-phone, sync-and-save, gmb/status sab phone se hi kaam karte hain).
  const phone = String(searchParams.get("phone") || "").replace(/\D/g, "");
  if (phone) {
    return { url: buildAuthUrl({ phone }, callbackUrl, forceConsent) };
  }

  return { error: true };
}

/** JSON URL lauta ta hai — client `window.location.href` set karta hai. */
export async function POST(request) {
  const result = resolve(request);
  if (result.error) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ url: result.url });
}

/** Seedha link/redirect ke liye. */
export async function GET(request) {
  const result = resolve(request);
  if (result.error) {
    // request.url proxy ke peeche localhost hota hai — fixed base use karo.
    return NextResponse.redirect(new URL("/login", GMB_BASE_URL));
  }
  return NextResponse.redirect(result.url);
}
