import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

export const dynamic = "force-dynamic";

// GET: Fetch all franchise admins
export async function GET() {
  try {
    await dbConnect();
    // Fetch only admins with role 'franchiseAdmin'
    const admins = await Admin.find({ role: "franchiseAdmin" })
      .select("fullName email _id isActive")
      .lean();

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Toggle isActive status
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { adminId, isActive } = body;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "adminId is required" },
        { status: 400 }
      );
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true }
    ).select("fullName email _id isActive");

    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isActive ? "Admin activated successfully" : "Admin deactivated successfully",
      data: updatedAdmin
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}
