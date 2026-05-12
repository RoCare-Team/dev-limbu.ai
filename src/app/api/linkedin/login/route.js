import { NextResponse } from "next/server";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";
import { buildYoutubeLinkedinStatePayload } from "@/lib/chatbotPlatformOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");
    let userId = userIdParam;
    const phoneRaw = url.searchParams.get("phone");
    const source = (url.searchParams.get("source") || "").toLowerCase();
    const mobile = url.searchParams.get("mobile") === "true";
    const waReturnRaw = url.searchParams.get("wa_return");

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
      return NextResponse.json({ error: "userId or phone is required" }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const baseUrl = resolveOAuthRedirectOrigin(req);
    const redirectUri = `${baseUrl}/api/linkedin/callback`;

    const state = buildYoutubeLinkedinStatePayload({
      userId,
      mobile,
      phoneRaw,
      source,
      platform: "linkedin",
      userIdParamPresent: !!userIdParam,
      waReturnRaw,
    });

    const scope = "openid profile email w_member_social";

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error) {
    console.error("LinkedIn Login Route Error:", error);
    return NextResponse.json({ error: "Failed to generate login URL" }, { status: 500 });
  }
}
