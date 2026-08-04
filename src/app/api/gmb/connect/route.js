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
function buildAuthUrl(identity, callbackUrl, forceConsent, retried = false) {
  const state = jwt.sign({ ...identity, callbackUrl, retried }, JWT_SECRET, {
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
  // `prompt=consent` har baar ek NAYA refresh token mint karta hai. Google ek
  // Google-account + client par sirf 100 live refresh token rakhta hai aur
  // limit par sabse purana chupchap revoke kar deta hai — ek hi agency account
  // 50+ businesses par connected ho to ye cap jaldi hit hota hai aur purane
  // connections "1-2 din me" invalid_grant dene lagte hain.
  //
  // Isliye consent sirf tab jab sach me naya token chahiye. Warna
  // `select_account`: user account chun sakta hai, par naya token mint nahi
  // hota — callback account ka pehle se stored token reuse kar leta hai.
  params.set("prompt", forceConsent ? "consent" : "select_account");

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Consent screen (`prompt=consent`) sirf tab dikhana chahiye jab hume ek naya
 * refresh token chahiye — yaani pehli baar connect, ya reconnect after revoke.
 *
 * Agar pehle se ek valid connection (refresh token) maujood hai, to consent
 * force karna hi wo "bar-bar permission maango" wala behaviour tha. Google is
 * case me consent screen skip karke seedha wapas bhej deta hai (already
 * authorized). Refresh token callback me preserve ho jata hai.
 *
 * `?consent=1` se caller jaan-boojhkar consent maang sakta hai (jaise "Switch
 * account" flow), aur `?consent=0` kabhi force nahi karta.
 */
async function shouldForceConsent(request) {
  const consentParam = new URL(request.url).searchParams.get("consent");
  if (consentParam === "1") return true;
  if (consentParam === "0") return false;

  // Default: consent NAHI.
  //
  // Pehle "is app user ka apna valid token nahi hai" par consent force hota
  // tha — matlab har naye business/user ke connect par ek naya refresh token
  // mint hota tha, chahe wahi Google account pehle se 50 jagah juda ho. Yahi
  // Google ke 100-token-per-account cap ko hit karta tha aur purane tokens
  // silently revoke hote the.
  //
  // Ab: pehle bina consent try karo. Google naya account hone par khud consent
  // screen dikha kar refresh token deta hai; pehle se granted account par token
  // nahi bhejta — us case me callback usi account ka stored token reuse karta
  // hai, aur wo bhi na mile to ek baar `consent=1` ke saath dobara bhejta hai.
  return false;
}

async function resolve(request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // WhatsApp chatbot flow (/connect-google-business?phone=…). Ye JAAN-BOOJHKAR
  // app session se PEHLE dekha jata hai.
  //
  // Wajah: ye link WhatsApp se khulta hai aur aksar agent/shared device par —
  // jahan browser me kisi AUR app user ka login pada ho sakta hai. Pehle app
  // session ko priority thi, to connect us doosre user ke record par chala jata
  // tha aur phone cookie set hi nahi hoti thi (callback sirf phone flow me set
  // karta hai) — yaani galat account connect ho jata. URL ka phone hi is flow ki
  // asli identity hai. `resolveGmbOwnerId` us phone ka asli User mil jaye to
  // uske userId par hi store karta hai, isliye normal user ko koi nuksan nahi.
  // Callback ka one-shot retry — dobara loop na ho isliye state me carry hota hai.
  const retried = searchParams.get("retried") === "1";
  const forceConsent = await shouldForceConsent(request);

  const phone = String(searchParams.get("phone") || "").replace(/\D/g, "");
  if (phone) {
    return { url: buildAuthUrl({ phone }, callbackUrl, forceConsent, retried) };
  }

  const appUser = getAppUser(request);
  if (appUser?.userId) {
    return {
      url: buildAuthUrl({ userId: appUser.userId }, callbackUrl, forceConsent, retried),
    };
  }

  return { error: true };
}

/** JSON URL lauta ta hai — client `window.location.href` set karta hai. */
export async function POST(request) {
  const result = await resolve(request);
  if (result.error) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ url: result.url });
}

/** Seedha link/redirect ke liye. */
export async function GET(request) {
  const result = await resolve(request);
  if (result.error) {
    // request.url proxy ke peeche localhost hota hai — fixed base use karo.
    return NextResponse.redirect(new URL("/login", GMB_BASE_URL));
  }
  return NextResponse.redirect(result.url);
}
