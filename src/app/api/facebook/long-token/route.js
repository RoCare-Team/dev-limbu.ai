import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

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

    // 🔁 Convert short token to long token
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
    console.log("Long Token:", longToken);

    // 👤 Get user profile
    const profileRes = await axios.get(
      "https://graph.facebook.com/me",
      {
        params: {
          access_token: longToken,
          fields: "name,id",
        },
      }
    );

    // 📄 Get user pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      { params: { access_token: longToken } }
    );

    const pages = pagesRes.data.data;
    console.log("User Pages:", pages);

    // 💾 Save pages to DB (User-wise)
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

    return NextResponse.json({
      success: true,
      accountId: profileRes.data.id,
      accountName: profileRes.data.name,
      pages,
      long_access_token: longToken,
      expires_in: longRes.data.expires_in,
    });

  } catch (error) {
    console.error("Mobile connect error:", error.response?.data || error.message);

    return NextResponse.json(
      { success: false, error: "Token conversion failed" },
      { status: 500 }
    );
  }
}
