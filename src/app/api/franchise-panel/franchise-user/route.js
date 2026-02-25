import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const referCode = searchParams.get("referCode");

    // Agar referCode nahi hai → empty return
    if (!referCode) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
      });
    }

    const users = await User.find({ referCode })
      .select("fullName email phone referCode createdAt leadStage")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      total: users.length,
      users,
    });

  } catch (error) {
    console.error("Franchise users API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}