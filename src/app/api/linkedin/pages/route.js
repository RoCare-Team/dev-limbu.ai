import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkedinPage from "@/models/LinkedinProfile";
import { buildYoutubeLinkedinListFilter } from "@/lib/youtubeLinkedinListFilter";

/**
 * GET …/api/linkedin/pages?userId=…
 *
 * Same filtering as YouTube channels (manual by default; `type=chatbot` for chatbot-only).
 */
export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" });
    }

    const filter = { userId, ...buildYoutubeLinkedinListFilter(url.searchParams) };
    const pages = await LinkedinPage.find(filter);
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error("Fetch Linkedin Pages Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
