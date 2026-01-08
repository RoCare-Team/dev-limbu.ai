import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) throw new Error("Missing data");

    // 1️⃣ Code → User Token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${process.env.BASE_URL}/api/instagram/callback`,
          code,
        },
      }
    );

    // 2️⃣ Long-lived token
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

    // 3️⃣ Get Facebook Pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      { params: { access_token: userToken } }
    );

    // 4️⃣ Find Instagram Business Account
    let igAccount = null;

    for (const page of pagesRes.data.data) {
      const igRes = await axios.get(
        `https://graph.facebook.com/v24.0/${page.id}`,
        {
          params: {
            fields: "instagram_business_account{name,username,id}",
            access_token: page.access_token,
          },
        }
      );

      if (igRes.data.instagram_business_account) {
        igAccount = {
          ...igRes.data.instagram_business_account,
          pageAccessToken: page.access_token,
        };
        break;
      }
    }

    if (!igAccount) throw new Error("No Instagram Business account found");

    // 5️⃣ Save Instagram Account
    await InstagramPage.deleteMany({ userId });

    await InstagramPage.create({
      userId,
      igId: igAccount.id,
      igUsername: igAccount.username,
      pageAccessToken: igAccount.pageAccessToken,
      platform: "instagram",
    });

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?ig=connected`
    );
  } catch (err) {
    console.error("IG CALLBACK ERROR:", err.message);
    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?ig=error`
    );
  }
}
