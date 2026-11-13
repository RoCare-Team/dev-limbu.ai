import { NextResponse } from "next/server";
import { AUTOMATION_SCOPES } from "@/lib/social/metaGraph";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const { searchParams } = new URL(req.url);
  // ?automation=1: also ask for the social automation permissions (insights,
  // comment / DM replies, hiding comments). Normal logins are unchanged.
  const wantsAutomation = searchParams.get("automation") === "1";

  const userIdParam = searchParams.get("userId");
  let userId = searchParams.get("userId");
  const phoneRaw = searchParams.get("phone");
  const source = (searchParams.get("source") || "").toLowerCase();

  // ✅ Mobile flag
  const mobile = searchParams.get("mobile") === "true";

  if (mobile && !userId) {
    return NextResponse.json(
      { error: "userId is required for mobile login" },
      { status: 400 }
    );
  }

  if (!mobile && !userId && phoneRaw) {
    const resolved = await resolveDashboardUserIdByPhone(phoneRaw);
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "No dashboard user for this phone. Use the same number as Limbu OTP login, or open connect-business for steps.",
        },
        { status: 404 }
      );
    }
    userId = resolved;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    );
  }

  /* --------------------------------------------------
     DEFAULT STATE — Dashboard + Mobile dono support
  -------------------------------------------------- */

  let oauthState = encodeMetaOAuthState({
    userId,
    mobile,           // ✅ mobile flag encode
    platform: "ig",
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
        platform: "ig",
        source: "chatbot",
        mobile,         // ✅ mobile flag chatbot mein bhi
      });
    }
  }

  /* --------------------------------------------------
     INSTAGRAM OAUTH PARAMS
  -------------------------------------------------- */

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${baseUrl}/api/instagram/callback`,
    scope: [
      "pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement",
      ...(wantsAutomation ? AUTOMATION_SCOPES.instagram : []),
    ].join(","),
    response_type: "code",
    state: oauthState,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`
  );
}
