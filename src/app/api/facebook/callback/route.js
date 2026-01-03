import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage"; // model neeche diya hai

export async function GET(req) {
  try {
    await dbConnect();

    const code = new URL(req.url).searchParams.get("code");

    // 1️⃣ Get user access token
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

    const userToken = tokenRes.data.access_token;

    // 2️⃣ Fetch pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userToken },
      }
    );
     console.log("FB PAGES RAW:", pagesRes.data);

    // 3️⃣ SAVE EACH PAGE
    for (const page of pagesRes.data.data) {
      await FacebookPage.findOneAndUpdate(
        { pageId: page.id },
        {
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
    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?fb=error`
    );
  }
}
