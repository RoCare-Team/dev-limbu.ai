import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

export async function GET(req) {
  try {
    await dbConnect();

    // 🔹 URL se userId nikalo
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    // 🔹 userId + platform filter
    const pages = await InstagramPage.find({
      userId,
      platform: "instagram",
    }).sort({ createdAt: -1 });

    console.log("Instagram pages:", pages);

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error("Instagram GET error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
