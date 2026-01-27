import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

export async function POST(req) {
  try {
    await dbConnect();

    const { short_token, userId } = await req.json();

    if (!short_token || !userId) {
      return NextResponse.json(
        { success: false, error: "short_token and userId required" },
        { status: 400 }
      );
    }

    // 🔁 Short-lived → Long-lived token
    const longRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: short_token,
        },
      }
    );

    const longToken = longRes.data.access_token;

    // 📄 Get Facebook Pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: {
          access_token: longToken,
          fields: "id,name,instagram_business_account",
        },
      }
    );

    const pages = pagesRes.data.data || [];
    const savedAccounts = [];

    // 🔍 Extract Instagram accounts
    for (const page of pages) {
      if (!page.instagram_business_account) continue;

      const igId = page.instagram_business_account.id;

      // 📸 Get Instagram details
      const igRes = await axios.get(
        `https://graph.facebook.com/v24.0/${igId}`,
        {
          params: {
            access_token: longToken,
            fields: "id,username",
          },
        }
      );

      const ig = igRes.data;

      // 💾 Save exactly as per your schema
      const saved = await InstagramPage.findOneAndUpdate(
        { userId, igId: ig.id },
        {
          userId,
          igId: ig.id,
          igUsername: ig.username,
          pageAccessToken: longToken,
          platform: "instagram",
        },
        { upsert: true, new: true }
      );

      savedAccounts.push(saved);
    }

    return NextResponse.json({
      success: true,
      instagramPages: savedAccounts,
      long_access_token: longToken,
      expires_in: longRes.data.expires_in,
    });

  } catch (error) {
    console.error(
      "Instagram connect error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      { success: false, error: "Instagram connection failed" },
      { status: 500 }
    );
  }
}
