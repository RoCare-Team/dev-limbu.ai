import { NextResponse } from "next/server";
import { getBaseUrl } from "@/utils/urlHelper";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const mobile = searchParams.get("mobile") === "true";

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/youtube/callback`;
  const state = encodeURIComponent(JSON.stringify({ userId, mobile }));

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
