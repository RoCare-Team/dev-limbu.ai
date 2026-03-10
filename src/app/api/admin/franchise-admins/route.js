import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

// ==================
// GET: FETCH FRANCHISE ADMINS
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const franchiseAdmins = await Admin.find({ role: "franchiseAdmin" })
      .select("fullName email role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: franchiseAdmins,
    });
  } catch (error) {
    console.error("Fetch Franchise Admins Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// ==================
// PATCH: TOGGLE ADMIN ACTIVE STATUS
// ==================
export async function PATCH(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { adminId, isActive } = body;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin ID is required" },
        { status: 400 }
      );
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive: isActive },
      { new: true }
    ).select("fullName email role isActive").lean();

    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isActive ? "Admin activated" : "Admin deactivated",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update Admin Status Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

