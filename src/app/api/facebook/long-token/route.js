import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const shortToken = url.searchParams.get("short_token");

    if (!shortToken) {
      return NextResponse.json(
        { error: "short_token is required" },
        { status: 400 }
      );
    }

    const res = await axios.get(
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

    return NextResponse.json({
      long_access_token: res.data.access_token,
      expires_in: res.data.expires_in, // ~60 days
      token_type: res.data.token_type,
    });
    // 9311724598
  } catch (error) {
    console.error("TOKEN CONVERSION ERROR:", error.response?.data || error);

    return NextResponse.json(
      {
        error: "Failed to convert token",
        details: error.response?.data,
      },
      { status: 500 }
    );
  }
}
