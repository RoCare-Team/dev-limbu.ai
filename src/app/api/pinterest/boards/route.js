import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestBoard from "@/models/PinterestProfile";

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" });
    }

    const boards = await PinterestBoard.find({ userId });
    return NextResponse.json({ success: true, boards });
  } catch (error) {
    console.error("Fetch Pinterest Boards Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
