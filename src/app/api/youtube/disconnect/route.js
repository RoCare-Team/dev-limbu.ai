import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, channelId } = await req.json();

    if (!userId || !channelId) {
      return NextResponse.json(
        { success: false, message: "userId and channelId are required" },
        { status: 400 }
      );
    }

    // Find and delete the specific channel
    const deletedChannel = await YouTubeChannel.findOneAndDelete({
      userId,
      channelId
    });

    if (!deletedChannel) {
      return NextResponse.json(
        { success: false, message: "Channel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "YouTube channel disconnected successfully"
    });
  } catch (error) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}