import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

export async function GET() {
  await dbConnect();

  const pages = await FacebookPage.find({ platform: "facebook" }).sort({
    createdAt: -1,
  });

  return NextResponse.json({ success: true, pages });
}
