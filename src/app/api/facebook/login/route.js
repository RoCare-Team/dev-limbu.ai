
// ye Next.js ka response helper.|| Redirect ya JSON response bhejne ke liye.|| Agar ye hata dein → NextResponse.redirect() error dega.
import { NextResponse } from "next/server";
import {
  normalizeMetaPhoneDigits,
  resolveDashboardUserIdByPhone,
} from "@/lib/metaChatbotResolveUser";
import { encodeMetaOAuthState } from "@/lib/metaOAuthState";

//  Ye GET request handler hai. || Jab user browser me hit kare:
export async function GET(req) {
  const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
  const { searchParams } = new URL(req.url); // ye Request ke URL ko parse kar raha hai.
  const userIdParam = searchParams.get("userId");
  let userId = searchParams.get("userId"); // ye URL se userId nikaal raha hai.
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

  if (!userId) { // ye Check kar raha hai ki userId mila ya nahi.
    return NextResponse.json(
      { error: "userId or phone required" },
      { status: 400 }
    ); // Bad request. Agar userId nahi bheja to error return karega.
  }

  // Manual dashboard: `state === userId`. Chatbot + phone: wrapped `m.…` for return URL.
  let oauthState = userId;
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
      });
    }
  }

  const params = new URLSearchParams({ // ye Query string parameters banane ka object. || Ye automatically encode karta hai URL ko.
    client_id: process.env.META_APP_ID, // ye Ye batata hai kaunsi app login kar rahi hai. || Agar galat ID ho → Facebook error dega.
    redirect_uri: `${baseUrl}/api/facebook/callback`, // ye Login ke baad Facebook user ko yaha bhejega.|| Agar mismatch ho → “Redirect URI mismatch” error.
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,business_management",
    response_type: "code", // ye Hum Facebook se authorization code chahte hain.|| OAuth flow me pehle code milta hai, || phir us code se token milta hai.
    state: oauthState,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`
  ); // ye  User ko Facebook login page par bhej raha hai. || Final URL kuch aisa banega:
}
