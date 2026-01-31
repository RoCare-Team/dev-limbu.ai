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
          // Revoke Facebook Page Token
          await axios.delete(
            `https://graph.facebook.com/v24.0/${page.pageId}/permissions`,
            { params: { access_token: page.pageAccessToken } }
          );
        } catch (err) {
          // Log but continue
          console.error("FB revoke error", err.response?.data || err.message);
        }
      }
      await FacebookPage.deleteMany({ userId });
    }
    // Remove Instagram Pages and revoke tokens
    if (instagram) {
      const igPages = await InstagramPage.find({ userId });
      for (const page of igPages) {
        try {
          // Revoke Instagram (via FB Page token)
          await axios.delete(
            `https://graph.facebook.com/v24.0/${page.igId}/permissions`,
            { params: { access_token: page.pageAccessToken } }
          );
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
