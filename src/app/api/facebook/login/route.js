// ye Next.js ka response helper.
// Redirect ya JSON response bhejne ke liye.
import { NextResponse } from "next/server";

import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";

import { encodeMetaOAuthState } from "@/lib/metaOAuthState";

import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

// Ye GET request handler hai.
// Jab user browser me hit kare:
export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);

  // Request URL parse kar raha hai
  const { searchParams } = new URL(req.url);

  const userIdParam = searchParams.get("userId");

  // URL se userId nikaal raha hai
  let userId = searchParams.get("userId");

  const phoneRaw = searchParams.get("phone");

  const source = (searchParams.get("source") || "").toLowerCase();

  // Mobile app request detect
  const mobile = searchParams.get("mobile") === "true";

  // Agar userId nahi hai but phone hai
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

  // Agar userId nahi mila
  if (!userId) {
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    );
  }

  /* --------------------------------------------------
     DEFAULT STATE
     Dashboard + Mobile dono support
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
    !!phoneRaw && (source === "chatbot" || !userIdParam);

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
    }
  }

  /* --------------------------------------------------
     FACEBOOK OAUTH PARAMS
  -------------------------------------------------- */

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,

    // Login ke baad Facebook yaha redirect karega
    redirect_uri: `${baseUrl}/api/facebook/callback`,

    scope:
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,business_management",

    response_type: "code",

    // encoded state
    state: oauthState,
  });

  /* --------------------------------------------------
     FACEBOOK LOGIN REDIRECT
  -------------------------------------------------- */

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`
  );
}