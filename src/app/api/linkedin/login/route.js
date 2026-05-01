import { NextResponse } from "next/server";
import { getBaseUrl } from "@/utils/urlHelper";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/linkedin/callback`;
    const state = userId; // Passing userId as state so we know who logged in during callback
    
    // Scopes needed for standard sharing and managing organizations
    // Note: User must have these enabled in their LinkedIn Developer App
    const scope = "openid profile email w_member_social w_organization_social r_organization_social rw_organization_admin";
    
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error) {
    console.error("LinkedIn Login Route Error:", error);
    return NextResponse.json({ error: "Failed to generate login URL" }, { status: 500 });
  }
}
