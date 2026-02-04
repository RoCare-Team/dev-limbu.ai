import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // 🔥 Sirf wahi users jinke paas refer_code hai
    const users = await User.find({
      referCode: { $exists: true, $ne: "" },
    }).select(
      "fullName email phone refer_code createdAt"
    );

    return NextResponse.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Refer code users API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
