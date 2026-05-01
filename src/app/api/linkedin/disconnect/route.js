import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkedinPage from "@/models/LinkedinPage";

export async function POST(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const pageId = url.searchParams.get("pageId");

    if (!userId || !pageId) {
      return NextResponse.json({ success: false, error: "Missing parameters" });
    }

    await LinkedinPage.findOneAndDelete({ userId, pageId });

    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.error("Disconnect Linkedin Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
