import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import axios from "axios";

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, facebook, instagram } = await req.json();
    // Remove Facebook Pages and revoke tokens
    if (facebook) {
      const fbPages = await FacebookPage.find({ userId });
      for (const page of fbPages) {
        try {
          // Revoke app permissions using user token (correct way)
          if (page.userAccessToken) {
            await axios.delete('https://graph.facebook.com/v24.0/me/permissions', {
              params: { 
                access_token: page.userAccessToken,
                permission: 'pages_show_list'
              }
            });
          }
          // Invalidate page token
          await axios.delete(`https://graph.facebook.com/v24.0/${page.pageId}`, {
            params: { access_token: page.userAccessToken }
          });
        } catch (err) {
          console.warn("FB revoke warning (expected):", err.response?.data || err.message);
        }
      }
      await FacebookPage.deleteMany({ userId });
    }
    // Remove Instagram Pages and revoke tokens
    if (instagram) {
      const igPages = await InstagramPage.find({ userId });
      for (const page of igPages) {
        try {
          // Revoke Instagram permissions using user token
          if (page.userAccessToken) {
            await axios.delete('https://graph.facebook.com/v24.0/me/permissions', {
              params: { 
                access_token: page.userAccessToken,
                permission: 'instagram_basic'
              }
            });
          }
          // Invalidate IG account token
          await axios.delete(`https://graph.facebook.com/v24.0/${page.igId}`, {
            params: { access_token: page.userAccessToken }
          });
        } catch (err) {
          // Log but continue
          console.error("IG revoke error", err.response?.data || err.message);
        }
      }
      await InstagramPage.deleteMany({ userId });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
