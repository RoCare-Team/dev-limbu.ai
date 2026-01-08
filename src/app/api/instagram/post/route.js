import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

export async function POST(req) {
  try {
    await dbConnect();

    const { userId, igId, imageUrl, caption } = await req.json();

    // ✅ Validation
    if (!userId || !igId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Find Instagram connection
    const ig = await InstagramPage.findOne({ userId, igId });

    if (!ig) {
      return NextResponse.json(
        { success: false, error: "Instagram not connected for this user" },
        { status: 404 }
      );
    }

    // 1️⃣ Create media container
    const mediaRes = await axios.post(
      `https://graph.facebook.com/v24.0/${igId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: ig.pageAccessToken,
      }
    );

    // 2️⃣ Publish media
    await axios.post(
      `https://graph.facebook.com/v24.0/${igId}/media_publish`,
      {
        creation_id: mediaRes.data.id,
        access_token: ig.pageAccessToken,
      }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Instagram Post Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
