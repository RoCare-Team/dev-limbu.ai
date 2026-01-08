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

    if (!code || !userId) throw new Error("Missing data");

    // Step 1: Code → User Token
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

    // Step 2: Long-lived token
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

    // Step 3: Get Pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userToken },
      }
    );

    // Step 4: Clear old pages
    await FacebookPage.deleteMany({ userId });

    // Step 5: Save Pages
    for (const page of pagesRes.data.data) {
      await FacebookPage.create({
        userId,
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
      });
    }

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?fb=connected`
    );
  } catch (err) {
    console.error(err.message);
    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?fb=error`
    );
  }
}
