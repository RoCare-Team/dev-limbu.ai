import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/dashboard?fb=missing_params`
      );
    }

    // 🔹 Get short token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${process.env.BASE_URL}/api/facebook/callback`,
          code,
        },
      }
    );

    // 🔹 Convert to long token
    const longRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: tokenRes.data.access_token,
        },
      }
    );

    const userToken = longRes.data.access_token;

    // 🔹 Fetch pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      { params: { access_token: userToken } }
    );

    const pages = pagesRes.data.data;

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/dashboard?fb=no_pages`
      );
    }

    // ❌ DO NOT delete old data blindly
    // Instead update / upsert pages
    for (const page of pages) {
      await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id },
        {
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          platform: "facebook",
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?fb=connected`
    );

  } catch (err) {
    console.error("FB CALLBACK ERROR:", err.response?.data || err.message);

    // 🔁 Token invalid → force reconnect
    return NextResponse.redirect(
      `https://www.facebook.com/v24.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.BASE_URL}/api/facebook/callback&scope=pages_show_list,pages_manage_posts,pages_read_engagement&state=RECONNECT`
    );
  }
}
