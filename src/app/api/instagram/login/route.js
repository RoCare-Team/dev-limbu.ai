import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("userId");
  const phoneRaw = searchParams.get("phone");

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
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    );
  }

  // Manual dashboard: `state === userId`. Chatbot + phone: wrapped `m.…` for return URL.
  let oauthState = userId;
  if (phoneRaw) {
    const digits = normalizeMetaPhoneDigits(phoneRaw);
    if (digits) {
      oauthState = encodeMetaOAuthState({
        userId,
        phone: digits,
        platform: "ig",
      });
    }
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.BASE_URL}/api/instagram/callback`,
    scope: "pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement",
    response_type: "code",
    state: oauthState,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`
  );
}
