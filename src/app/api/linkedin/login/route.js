import { NextResponse } from "next/server";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";
import { buildYoutubeLinkedinStatePayload } from "@/lib/chatbotPlatformOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  try {
    const url = new URL(req.url);

    // Params
    const userIdParam = url.searchParams.get("userId");
    let userId = userIdParam;

    const phoneRaw = url.searchParams.get("phone");

    const source = (url.searchParams.get("source") || "").toLowerCase();

    const mobile = url.searchParams.get("mobile") === "true";

    const waReturnRaw = url.searchParams.get("wa_return");

    /**
     * NEW
     * profile | page
     */
    const connectionType = url.searchParams.get("type") || "profile";

    /**
     * Resolve dashboard user from phone
     */
    if (!userId && phoneRaw) {
      const resolved = await resolveDashboardUserIdByPhone(phoneRaw);

      if (!resolved) {
        return NextResponse.json(
          {
            error: "No dashboard user found for this phone number.",
          },
          { status: 404 },
        );
      }

      userId = resolved;
    }

    /**
     * Validation
     */
    if (!userId) {
      return NextResponse.json(
        {
          error: "userId or phone is required",
        },
        { status: 400 },
      );
    }

    /**
     * OAuth Base URL
     */
    const baseUrl = resolveOAuthRedirectOrigin(req);

    const redirectUri = `${baseUrl}/api/linkedin/callback`;

    /**
     * Different Credentials
     * Profile vs Page
     */
    const clientId =
      connectionType === "page"
        ? process.env.MANNU_LINKEDIN_CLIENT_ID
        : process.env.LINKEDIN_CLIENT_ID;

    /**
     * Different Scopes
     */
    const scope =
      connectionType === "page"
        ? "openid profile email w_organization_social" // removed r_organization_social
        : "openid profile email w_member_social";

    /**
     * OAuth State
     */
    const state = buildYoutubeLinkedinStatePayload({
      userId,
      mobile,
      phoneRaw,
      source,

      platform: "linkedin",

      /**
       * IMPORTANT
       */
      connectionType,

      userIdParamPresent: !!userIdParam,

      waReturnRaw,
    });

    /**
     * LinkedIn OAuth URL
     */
    const linkedinAuthUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scope)}`;

    /**
     * Redirect to LinkedIn
     */
    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error) {
    console.error("LinkedIn Login Route Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate LinkedIn login URL",
      },
      { status: 500 },
    );
  }
}
