import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const referCode = searchParams.get("referCode");

    const query = {
      referCode: { $exists: true, $ne: "" },
    };

    if (referCode) {
      query.referCode = referCode;
    }

    // 🔥 Sirf wahi users jinke paas refer_code hai
    const users = await User.find(query).select(
      "fullName email phone referCode createdAt"
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
