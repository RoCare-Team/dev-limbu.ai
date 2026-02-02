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

    /* ---------------------------------------------
       1️⃣ SHORT-LIVED USER TOKEN
    --------------------------------------------- */
    const shortTokenRes = await axios.get(
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

    const shortToken = shortTokenRes.data.access_token;

    /* ---------------------------------------------
       2️⃣ LONG-LIVED USER TOKEN (60 days)
    --------------------------------------------- */
    const longTokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortToken,
        },
      }
    );

    const userAccessToken = longTokenRes.data.access_token;
    const expiresIn = longTokenRes.data.expires_in; // seconds

    const tokenExpiryDate = new Date(
      Date.now() + expiresIn * 1000
    );

    /* ---------------------------------------------
       3️⃣ FETCH FACEBOOK PAGES
    --------------------------------------------- */
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userAccessToken },
      }
    );

    const pages = pagesRes.data.data;

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/dashboard?fb=no_pages`
      );
    }

    /* ---------------------------------------------
       4️⃣ SAVE LONG TOKEN + PAGE TOKENS
    --------------------------------------------- */
    for (const page of pages) {
      await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id },
        {
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token, // page long token
          userAccessToken,                   // 🔥 USER LONG TOKEN
          userTokenExpiresAt: tokenExpiryDate,
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

    return NextResponse.redirect(
      `https://www.facebook.com/v24.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.BASE_URL}/api/facebook/callback&scope=pages_show_list,pages_manage_posts,pages_read_engagement&state=RECONNECT`
    );
  }
}
