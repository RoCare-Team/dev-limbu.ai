import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const referCode = searchParams.get("referCode");

    if (!referCode) {
      return NextResponse.json({
        success: true,
        total: 0,
        users: [],
      });
    }

    const total = await User.countDocuments({ referCode });

    const users = await User.find({ referCode })
      .select("fullName email phone referCode createdAt leadStage wallet") // ⭐ wallet add
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      total,
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