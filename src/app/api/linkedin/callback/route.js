import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkedinPage from "@/models/LinkedinPage";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state"); 

    if (!code || !userId) {
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?linkedin=missing_params`);
    }

    // 1️⃣ Exchange Authorization Code for Access Token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: `${process.env.BASE_URL}/api/linkedin/callback`,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // 2️⃣ Fetch User Profile (Personal Page)
    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    const personUrn = profileRes.data.sub; // The unique user ID
    const personName = profileRes.data.name || "LinkedIn User";

    // Save Personal Profile so user can post to their own wall
    await LinkedinPage.findOneAndUpdate(
      { userId, pageId: `urn:li:person:${personUrn}` },
      {
        userId,
        pageId: `urn:li:person:${personUrn}`,
        pageName: `${personName} (Profile)`,
        pageAccessToken: access_token,
        pageTokenExpiresAt: expiresAt,
        platform: "linkedin",
        type: "profile"
      },
      { upsert: true, new: true }
    );

    // 3️⃣ Try fetching Organizations (Company Pages) if scope is granted
    try {
      const orgsRes = await axios.get("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const elements = orgsRes.data.elements || [];
      for (const el of elements) {
        const orgUrn = el.organization; // e.g. "urn:li:organization:12345"
        const orgId = orgUrn.split(":").pop();
        
        await LinkedinPage.findOneAndUpdate(
          { userId, pageId: orgUrn },
          {
            userId,
            pageId: orgUrn,
            pageName: `Company Page (${orgId})`, // Fallback name
            pageAccessToken: access_token,
            pageTokenExpiresAt: expiresAt,
            platform: "linkedin",
            type: "organization"
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.log("Note: Could not fetch orgs. This is normal if the app lacks company page scopes.", err.response?.data || err.message);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?linkedin=connected`);
  } catch (err) {
    console.error("LINKEDIN CALLBACK ERROR:", err.response?.data || err.message);
    return NextResponse.redirect(`${baseUrl}/dashboard?linkedin=error`);
  }
}
  return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?linkedin=error`);
  }
}
