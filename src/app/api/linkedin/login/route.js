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
    
    // Check if the request is from a mobile app
    const mobile = url.searchParams.get("mobile") === "true";
    
    // Encode userId and mobile flag into state
    const state = encodeURIComponent(JSON.stringify({ userId, mobile })); // Passing userId and mobile as state
    
    // Scopes needed for standard sharing. 
    // basic: openid, profile, email (Sign In with LinkedIn using OpenID Connect)
    // sharing: w_member_social (Share on LinkedIn)
    // IMPORTANT: Requesting organization scopes (w_organization_social, r_organization_social, rw_organization_admin) 
    // WILL CRASH the login with a "Bummer" error unless your LinkedIn Developer app is explicitly approved 
    // for "Community Management API" or "Marketing Developer Platform".
    const scope = "openid profile email w_member_social";
    
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(linkedinAuthUrl);
  } catch (error) {
    console.error("LinkedIn Login Route Error:", error);
    return NextResponse.json({ error: "Failed to generate login URL" }, { status: 500 });
  }
}
