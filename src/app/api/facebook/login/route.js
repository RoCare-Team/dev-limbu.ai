import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.BASE_URL}/api/facebook/callback`,
    scope:
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,public_profile,email,instagram_basic,instagram_manage_insights,instagram_content_publish",
    response_type: "code",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params}`
  );
}
