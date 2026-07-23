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
function buildAuthUrl(userId, callbackUrl, forceConsent) {
  const state = jwt.sign({ userId, callbackUrl }, JWT_SECRET, { expiresIn: "10m" });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: gmbRedirectUri(),
    response_type: "code",
    scope: GMB_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    state,
  });
  // Consent sirf tab jab refresh token chahiye — har baar nahi.
  if (forceConsent) params.set("prompt", "consent");

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function resolve(request) {
  const appUser = getAppUser(request);
  if (!appUser?.userId) return { error: true };

  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  // Pehla connect / reconnect — dono me refresh token chahiye.
  const forceConsent = searchParams.get("consent") !== "0";

  return { url: buildAuthUrl(appUser.userId, callbackUrl, forceConsent) };
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
