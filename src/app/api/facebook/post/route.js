import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  console.log("📌 Facebook Post API called");

  try {
    // 1️⃣ CONNECT DB
    await dbConnect();

    // 2️⃣ CHECK SESSION
    const session = await getServerSession(authOptions);
    console.log("session",session);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log("userId",userId);
    


    // 3️⃣ READ REQUEST BODY
    const { pageId, message } = await req.json();

    if (!pageId || !message) {
      return NextResponse.json(
        { success: false, error: "pageId or message missing" },
        { status: 400 }
      );
    }

    // 4️⃣ FETCH PAGE (USER-SPECIFIC)
    const page = await FacebookPage.findOne({
      userId,
      pageId,
      platform: "facebook",
    });

    console.log("pagepagepagepagepagepagepage",page);
    

    if (!page || !page.pageAccessToken) {
      return NextResponse.json(
        { success: false, error: "Facebook page not connected" },
        { status: 403 }
      );
    }

    // 5️⃣ POST TO FACEBOOK PAGE
    const fbResponse = await axios.post(
      `https://graph.facebook.com/v24.0/${pageId}/feed`,
      {
        message,
        published: true,
        access_token: page.pageAccessToken, // ✅ CORRECT TOKEN
      }
    );

    console.log("fbResponsefbResponse",fbResponse);
    

    console.log("✅ Facebook Post Success:", fbResponse.data);

    return NextResponse.json({
      success: true,
      postId: fbResponse.data.id,
    });

  } catch (err) {
    console.error("🔥 Facebook Post Error");

    if (err.response) {
      console.error("FB STATUS:", err.response.status);
      console.error("FB DATA:", err.response.data);
    } else {
      console.error("ERROR:", err.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: err.response?.data || err.message,
      },
      { status: 500 }
    );
  }
}
