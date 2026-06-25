import { NextResponse } from "next/server";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";
import { buildYoutubeLinkedinStatePayload } from "@/lib/chatbotPlatformOAuthState";

/**
 * Single source of truth for the app origin.
 * The callback route MUST use this exact same base so the redirect_uri
 * matches byte-for-byte (LinkedIn rejects any mismatch).
 *
 * Set APP_ORIGIN in .env:
 *   local : APP_ORIGIN=http://localhost:3000
 *   prod  : APP_ORIGIN=https://limbu.ai
 */
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

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
     * Connection type: "page" (organization) or "profile" (personal member).
     */
    const typeParam = (url.searchParams.get("type") || "page").toLowerCase();
    const connectionType = typeParam === "profile" ? "profile" : "page";
    const isProfile = connectionType === "profile";

    /**
     * Scopes differ per type:
     *  - profile : OpenID member sign-in + share as member
     *  - page    : organization admin + social
     */
    const scope = isProfile
      ? "openid profile email w_member_social"
      : "r_organization_social w_organization_social rw_organization_admin";

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

    // Must exactly match the callback's redirectUri — both derive from
    // APP_ORIGIN so they stay in sync across localhost / live.
    // NOTE: this exact string must be whitelisted in BOTH LinkedIn apps
    // (page app + profile app) under "Authorized redirect URLs".
    const redirectUri = `${APP_ORIGIN}/api/linkedin/callback`;

    /**
     * Separate LinkedIn app/credentials per connection type.
     */
    const clientId = isProfile
      ? process.env.LINKEDIN_CLIENT_ID_PROFILE
      : process.env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: "LinkedIn client is not configured on the server" },
        { status: 500 },
      );
    }

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
       * IMPORTANT — callback reads this to pick the matching client/secret + flow.
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