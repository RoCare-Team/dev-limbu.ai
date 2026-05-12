import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";
import { buildYoutubeLinkedinListFilter } from "@/lib/youtubeLinkedinListFilter";

/**
 * GET …/api/youtube/channels?userId=…
 *
 * See `buildYoutubeLinkedinListFilter` — default list is **manual + legacy** (excludes chatbot).
 * Chatbot UI: `?type=chatbot&phone=…` (optional phone narrows to that WhatsApp number).
 * Everything: `?type=all`
 */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    const filter = { userId, ...buildYoutubeLinkedinListFilter(searchParams) };
    const channels = await YouTubeChannel.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, channels });
  } catch (error) {
    console.error("GET channels error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
