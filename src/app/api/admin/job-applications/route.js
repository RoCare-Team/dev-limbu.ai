

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import JobApplication from "@/models/JobApplication";

export async function GET() {
  try {
    await dbConnect();

    const applications =
      await JobApplication.find()
        .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}