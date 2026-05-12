import { NextResponse } from "next/server";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";
import { buildYoutubeLinkedinStatePayload } from "@/lib/chatbotPlatformOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  let userId = userIdParam;
  const phoneRaw = searchParams.get("phone");
  const source = (searchParams.get("source") || "").toLowerCase();
  const mobile = searchParams.get("mobile") === "true";
  const waReturnRaw = searchParams.get("wa_return");

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
    return NextResponse.json({ error: "userId or phone required" }, { status: 400 });
  }

  const baseUrl = resolveOAuthRedirectOrigin(req);
  const redirectUri = `${baseUrl}/api/youtube/callback`;
  const state = buildYoutubeLinkedinStatePayload({
    userId,
    mobile,
    phoneRaw,
    source,
    platform: "youtube",
    userIdParamPresent: !!userIdParam,
    waReturnRaw,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope:
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly",
    response_type: "code",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
