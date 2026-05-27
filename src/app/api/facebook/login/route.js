import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";

const BASE_URL = "https://limbu.ai";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const userIdParam = searchParams.get("userId");
  let userId = searchParams.get("userId");
  const phoneRaw = searchParams.get("phone");
  const source = (searchParams.get("source") || "").toLowerCase();
  const mobile = searchParams.get("mobile") === "true";

  console.log("📲 [FB LOGIN] Request received");
  console.log("📲 [FB LOGIN] Params — userId:", userId, "| mobile:", mobile, "| source:", source, "| phone:", phoneRaw);
  console.log("📲 [FB LOGIN] baseUrl:", BASE_URL);
  console.log("📲 [FB LOGIN] redirect_uri will be:", `${BASE_URL}/api/facebook/callback`);

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
          error: "No dashboard user for this phone. Use the same number as Limbu OTP login, or open connect-business for steps.",
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

  // ✅ FIX: base64url decode (pehle base64 tha — isliye "could not decode" aata tha)
  const decodedStateCheck = (() => {
    try {
      const b64 = oauthState.startsWith("m.") ? oauthState.slice(2) : oauthState;
      return JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    } catch {
      return "could not decode";
    }
  })();

  console.log("🔐 [FB LOGIN] Decoded state verify:", JSON.stringify(decodedStateCheck));
  console.log("🔐 [FB LOGIN] mob field in state:", decodedStateCheck?.mob, "| type:", typeof decodedStateCheck?.mob);
  console.log("🔐 [FB LOGIN] mobile will parse as:", decodedStateCheck?.mob === true || decodedStateCheck?.mob === 1);

  /* --------------------------------------------------
     FACEBOOK OAUTH PARAMS
  -------------------------------------------------- */

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${BASE_URL}/api/facebook/callback`,
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,business_management",
    response_type: "code",
    state: oauthState,
  });

  const finalUrl = `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`;

  console.log("🚀 [FB LOGIN] Final redirect URL (first 120 chars):", finalUrl.substring(0, 120));

  return NextResponse.redirect(finalUrl);
}