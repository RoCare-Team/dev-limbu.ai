import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

export async function GET() {
  try {
    await dbConnect();

    const franchises = await FranchisePanel.find({})
      .select("-password") // password hide
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: franchises.length,
      data: franchises,
    });
  } catch (error) {
    console.error("Get All Franchises Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
