import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" });
    }

    const profiles = await PinterestProfile.find({ userId });
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error("Fetch Pinterest Profiles Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
