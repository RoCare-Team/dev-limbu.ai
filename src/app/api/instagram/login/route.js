
// ye Next.js ka response helper.|| Redirect ya JSON response bhejne ke liye.
import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

// Ye GET handler — Instagram OAuth (Facebook dialog, IG scopes).
export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const { searchParams } = new URL(req.url); // ye Request URL parse.
  const userIdParam = searchParams.get("userId");
  let userId = searchParams.get("userId"); // ye URL se userId.
  const phoneRaw = searchParams.get("phone");
  const source = (searchParams.get("source") || "").toLowerCase();

  if (!userId && phoneRaw) {
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
    // ye Check: userId / phone zaroor chahiye.
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    ); // Bad request.
  }

  // Manual dashboard: `state === userId`. Chatbot + phone: wrapped `m.…`.
  let oauthState = userId;
  const shouldUseChatbotState =
    !!phoneRaw && (source === "chatbot" || !userIdParam);
  if (shouldUseChatbotState) {
    const digits = normalizeMetaPhoneDigits(phoneRaw);
    if (digits) {
      oauthState = encodeMetaOAuthState({
        userId,
        phone: digits,
        platform: "ig",
        source: "chatbot",
      });
    }
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    // Pehle `BASE_URL` (legacy `${BASE_URL}/api/instagram/callback`), warna forwarded host / request — callback route same origin use karti hai.
    redirect_uri: `${baseUrl}/api/instagram/callback`, // Meta allowlist match; login/callback identically aligned.
    scope:
      "pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement",
    response_type: "code",
    state: oauthState,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`
  ); // IG login = Facebook OAuth dialog + IG scopes.
}
