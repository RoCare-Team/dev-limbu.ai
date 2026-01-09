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

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { pageId, message } = await req.json();

    if (!pageId || !message) {
      return NextResponse.json(
        { success: false, error: "pageId or message missing" },
        { status: 400 }
      );
    }

    const page = await FacebookPage.findOne({ userId, pageId });

    if (!page || !page.pageAccessToken) {
      return NextResponse.json(
        { success: false, error: "Facebook page not connected" },
        { status: 403 }
      );
    }

    const fbResponse = await axios.post(
      `https://graph.facebook.com/v24.0/${pageId}/feed`,
      {
        message,
        access_token: page.pageAccessToken,
      }
    );

    return NextResponse.json({
      success: true,
      postId: fbResponse.data.id,
    });
  } catch (err) {
    console.error("Facebook Post Error:", err.response?.data || err.message);

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
