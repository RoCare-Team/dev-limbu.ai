import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

export async function POST(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const profileId = url.searchParams.get("profileId");

    if (!userId || !profileId) {
      return NextResponse.json({ success: false, error: "Missing parameters" });
    }

    // Using _id of the profile document or pinterestUserId to disconnect
    await PinterestProfile.findOneAndDelete({ userId, pinterestUserId: profileId });

    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.error("Disconnect Pinterest Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
