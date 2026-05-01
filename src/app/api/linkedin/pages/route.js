import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkedinPage from "@/models/LinkedinPage";

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" });
    }

    const pages = await LinkedinPage.find({ userId });
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error("Fetch Linkedin Pages Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
