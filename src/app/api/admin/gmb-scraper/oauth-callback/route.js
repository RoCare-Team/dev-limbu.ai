// File: /app/api/admin/gmb-scraper/oauth-callback/route.js

import { NextResponse } from "next/server";

const CLIENT_ID = "659200143320-vetsn0877eqpgpv22sthv54ds033o1rs.apps.googleusercontent.com";
const CLIENT_SECRET = "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";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error || "No code received"}' }, '*');
        window.close();
      </script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/gmb-scraper/oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "Token exchange failed");
    }

    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'GOOGLE_AUTH_TOKEN', token: '${tokenData.access_token}' }, '*');
        window.close();
      </script><p>Authentication successful! You can close this window.</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${err.message}' }, '*');
        window.close();
      </script><p>Authentication failed: ${err.message}</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
}