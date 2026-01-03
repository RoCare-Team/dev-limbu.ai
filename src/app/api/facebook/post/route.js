import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session.user.id;

    const { pageId, message } = await req.json();

    const page = await FacebookPage.findOne({ userId, pageId });
    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 403 }
      );
    }

    await axios.post(
      `https://graph.facebook.com/v24.0/${pageId}/feed`,
      {
        message,
        published: true, // 🔥 REQUIRED FOR PUBLIC POST
        access_token: page.pageAccessToken,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return NextResponse.json(
      { success: false, error: "Post failed" },
      { status: 500 }
    );
  }
}
