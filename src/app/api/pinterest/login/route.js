import { NextResponse } from "next/server";
import { getBaseUrl } from "@/utils/urlHelper";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const clientId = process.env.PINTEREST_CLIENT_ID;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/pinterest/callback`;
    const state = userId; 
    
    // Scopes needed for fetching boards and creating pins
    const scope = "user_accounts:read,boards:read,boards:write,pins:read,pins:write";
    
    const pinterestAuthUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

    return NextResponse.redirect(pinterestAuthUrl);
  } catch (error) {
    console.error("Pinterest Login Route Error:", error);
    return NextResponse.json({ error: "Failed to generate login URL" }, { status: 500 });
  }
}
