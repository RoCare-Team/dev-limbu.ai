import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";
import InstagramPage from "@/models/InstagramPage";
import YouTubeChannel from "@/models/YouTubeChannel"; // 1. Added YouTube Import

function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function normalizeType(type) {
  const raw = String(type || "")
    .trim()
    .toLowerCase();
  if (raw === "facebook" || raw === "fb") return "facebook";
  if (raw === "instagram" || raw === "ig") return "instagram";
  if (raw === "youtube" || raw === "yt") return "youtube"; // 2. Added YouTube normalization
  return "";
}

export const dynamic = "force-dynamic";

/**
 * GET /api/chatbot/meta-connection?phone=917740847114&type=youtube
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhoneDigits(searchParams.get("phone"));
    const type = normalizeType(searchParams.get("type"));

    if (!phone || !type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "phone and valid type (facebook|instagram|youtube) are required",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    let pagesData = []; // This will hold channel/page specific data
    let userId = "";
    let updatedAt = null;
    let createdAt = null;

    if (type === "facebook") {
      const docs = await FacebookPage.find({
        phone,
        platform: "facebook",
        connectionSource: "chatbot",
        $or: [{ type: "facebook" }, { type: { $exists: false } }, { type: "" }],
      })
        .sort({ updatedAt: -1 })
        .lean();

      pagesData = docs.map((doc) => ({
        pageId: doc.pageId,
        pageName: doc.pageName,
        pageAccessToken: doc.pageAccessToken,
      }));
      userId = docs[0]?.userId || "";
      updatedAt = docs[0]?.updatedAt || null;
      createdAt = docs[0]?.createdAt || null;
    } else if (type === "instagram") {
      const docs = await InstagramPage.find({
        phone,
        platform: "instagram",
        connectionSource: "chatbot",
        $or: [
          { type: "instagram" },
          { type: { $exists: false } },
          { type: "" },
        ],
      })
        .sort({ updatedAt: -1 })
        .lean();

      pagesData = docs.map((doc) => ({
        igId: doc.igId,
        igUsername: doc.igUsername,
        pageAccessToken: doc.pageAccessToken,
      }));
      userId = docs[0]?.userId || "";
      updatedAt = docs[0]?.updatedAt || null;
      createdAt = docs[0]?.createdAt || null;
    }
    // 3. Added YouTube Logic Block
    else if (type === "youtube") {
      const docs = await YouTubeChannel.find({
        phone,
        platform: "youtube",
        connectionSource: "chatbot",
      })
        .sort({ updatedAt: -1 })
        .lean();

      pagesData = docs.map((doc) => ({
        channelId: doc.channelId,
        channelTitle: doc.channelTitle,
        accessToken: doc.accessToken,
        // include refreshToken if your chatbot needs to handle token refresh
        refreshToken: doc.refreshToken,
      }));
      userId = docs[0]?.userId || "";
      updatedAt = docs[0]?.updatedAt || null;
      createdAt = docs[0]?.createdAt || null;
    }

    if (!pagesData.length) {
      return NextResponse.json({
        success: true,
        connected: false,
        phone,
        type,
        pagesData: [],
        message: "No connection found for this phone and type",
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      status: "connected",
      phone,
      userId,
      type,
      pagesData,
      updatedAt,
      createdAt,
    });
  } catch (error) {
    console.error("chatbot connection GET error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
