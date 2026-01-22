import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function refreshPageToken(userToken) {
  const pagesRes = await axios.get(
    "https://graph.facebook.com/v24.0/me/accounts",
    { params: { access_token: userToken } }
  );
  return pagesRes.data.data;
}

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { pageId, message } = await req.json();

    const page = await FacebookPage.findOne({ userId, pageId });

    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    try {
      const fbResponse = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          message,
          access_token: page.pageAccessToken,
        }
      );

      return NextResponse.json({ success: true, postId: fbResponse.data.id });

    } catch (error) {
      // 🔁 Token expired → re-auth
      console.log("Token expired, reauth needed");

      return NextResponse.json({
        success: false,
        error: "Facebook token expired. Please reconnect account."
      }, { status: 401 });
    }

  } catch (err) {
    console.error("Facebook Post Error:", err.response?.data || err.message);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
