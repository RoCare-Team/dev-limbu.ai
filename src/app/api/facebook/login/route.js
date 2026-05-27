// api/facebook/login/route.js  (ya jo bhi tumhara login initiate file hai)
import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const { searchParams } = new URL(req.url);

  const userIdParam = searchParams.get("userId");
  let userId = searchParams.get("userId");
  const phoneRaw = searchParams.get("phone");
  const source = (searchParams.get("source") || "").toLowerCase();
  const mobile = searchParams.get("mobile") === "true";

  // ✅ LOG 1: Request aaya
  console.log("📲 [FB LOGIN] Request received");
  console.log("📲 [FB LOGIN] Params — userId:", userId, "| mobile:", mobile, "| source:", source, "| phone:", phoneRaw);
  console.log("📲 [FB LOGIN] baseUrl resolved to:", baseUrl);
  console.log("📲 [FB LOGIN] redirect_uri will be:", `${baseUrl}/api/facebook/callback`);

  if (mobile && !userId) {
    console.error("❌ [FB LOGIN] Mobile request but no userId provided");
    return NextResponse.json(
      { error: "userId is required for mobile login" },
      { status: 400 }
    );
  }

  if (!mobile && !userId && phoneRaw) {
    console.log("🔍 [FB LOGIN] No userId, resolving by phone...");
    const resolved = await resolveDashboardUserIdByPhone(phoneRaw);

    if (!resolved) {
      console.error("❌ [FB LOGIN] No dashboard user found for phone:", phoneRaw);
      return NextResponse.json(
        {
          error:
            "No dashboard user for this phone. Use the same number as Limbu OTP login, or open connect-business for steps.",
        },
        { status: 404 }
      );
    }

    userId = resolved;
    console.log("✅ [FB LOGIN] userId resolved from phone:", userId);
  }

  if (!userId) {
    console.error("❌ [FB LOGIN] No userId and no phone provided");
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    );
  }

  /* --------------------------------------------------
     DEFAULT STATE
  -------------------------------------------------- */

  let oauthState = encodeMetaOAuthState({
    userId,
    mobile,
    platform: "fb",
    source: source || "dashboard",
  });

  /* --------------------------------------------------
     CHATBOT FLOW
  -------------------------------------------------- */

  const shouldUseChatbotState =
    !mobile && !!phoneRaw && (source === "chatbot" || !userIdParam);

  if (shouldUseChatbotState) {
    const digits = normalizeMetaPhoneDigits(phoneRaw);
    if (digits) {
      oauthState = encodeMetaOAuthState({
        userId,
        phone: digits,
        platform: "fb",
        source: "chatbot",
        mobile,
      });
      console.log("🤖 [FB LOGIN] Chatbot state encoded with phone:", digits);
    }
  }

  // ✅ LOG 2: State encode hua — mobile field verify karo
  const decodedStateCheck = (() => {
    try {
      // base64 decode करके check karo mobile field sahi ja raha hai
      const decoded = JSON.parse(
        Buffer.from(oauthState, "base64").toString("utf-8")
      );
      return decoded;
    } catch {
      return "could not decode";
    }
  })();
  console.log("🔐 [FB LOGIN] Encoded state (decoded for verify):", JSON.stringify(decodedStateCheck));
  console.log("🔐 [FB LOGIN] mobile field in state:", decodedStateCheck?.mobile, "| type:", typeof decodedStateCheck?.mobile);

  /* --------------------------------------------------
     FACEBOOK OAUTH PARAMS
  -------------------------------------------------- */

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${baseUrl}/api/facebook/callback`,
    scope:
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,business_management",
    response_type: "code",
    state: oauthState,
  });

  const finalUrl = `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`;

  // ✅ LOG 3: Final redirect
  console.log("🚀 [FB LOGIN] Redirecting to Facebook OAuth URL (first 120 chars):", finalUrl.substring(0, 120));

  return NextResponse.redirect(finalUrl);
}