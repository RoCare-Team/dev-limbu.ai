import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.BASE_URL}/api/instagram/callback`,
    scope:
      "pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement",
    response_type: "code",
    state: userId,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params}`
  );
}
