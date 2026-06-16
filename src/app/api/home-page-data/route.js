import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import HomePageData from "@/models/HomePageData";

export async function GET() {
  try {
    await dbConnect();

    const data = await HomePageData.findOne().lean();

    if (!data) {
      return NextResponse.json(
        { success: false, message: "No data found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}