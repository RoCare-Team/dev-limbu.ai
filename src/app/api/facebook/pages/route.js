import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

export async function GET(req) {
  try {
    await dbConnect();

    // 🔹 query param se userId nikalo
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    // 🔹 userId ke basis par fetch
    const pages = await FacebookPage.find({
      userId: userId,
      platform: "facebook", // optional (remove if not needed)
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error("GET pages error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
