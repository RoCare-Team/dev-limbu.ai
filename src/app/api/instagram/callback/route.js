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

    if (!code || !userId) {
      throw new Error("Missing OAuth code or userId");
    }

    // 1️⃣ Exchange Code → Short-Lived Token
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

    const shortToken = tokenRes.data.access_token;

    // 2️⃣ Short → Long-Lived Token
    const longRes = await axios.get(
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

    const userToken = longRes.data.access_token;

    // 3️⃣ Get Facebook Pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userToken },
      }
    );

    if (!pagesRes.data.data.length) {
      throw new Error("No Facebook pages found");
    }

    // 4️⃣ Get ALL Instagram Accounts
    let igAccounts = [];

    for (const page of pagesRes.data.data) {
      try {
        const igRes = await axios.get(
          `https://graph.facebook.com/v24.0/${page.id}`,
          {
            params: {
              fields: "instagram_business_account{id,username,name}",
              access_token: page.access_token,
            },
          }
        );

        if (igRes.data.instagram_business_account) {
          igAccounts.push({
            userId,
            igId: igRes.data.instagram_business_account.id,
            igUsername: igRes.data.instagram_business_account.username,
            pageAccessToken: page.access_token,
            platform: "instagram",
          });
        }
      } catch (err) {
        console.error(`Page ${page.id} IG fetch failed`);
      }
    }

    if (!igAccounts.length) {
      throw new Error("No Instagram Business/Creator accounts found");
    }

    // 5️⃣ Save All Accounts
    await InstagramPage.deleteMany({ userId });
    await InstagramPage.insertMany(igAccounts);

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?ig=connected&count=${igAccounts.length}`
    );

  } catch (err) {
    console.error("IG CALLBACK ERROR:", err.message);

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?ig=error`
    );
  }
}
