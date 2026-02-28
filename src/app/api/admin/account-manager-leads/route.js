import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

/* =========================
   GET USERS
========================= */
export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);

    const leadStage = searchParams.get("leadStage");
    const accountManagerParam = searchParams.get("accountManager");
    const email = searchParams.get("email");

    // Find the admin by email to get their role
    let filter = {};
    let loggedInRole = "";
    let loggedInAdminId = null;

    if (email) {
      const admin = await Admin.findOne({ email });
      if (admin) {
        loggedInRole = admin.role;
        loggedInAdminId = admin._id;
      }
    }

    // Apply role-based filtering
    if (loggedInRole === "manager" && loggedInAdminId) {
      // Manager: Only show users assigned to this manager
      filter.accountManager = new mongoose.Types.ObjectId(loggedInAdminId);
    } else if (accountManagerParam) {
      // SuperAdmin/Admin: Filter by specific manager if provided
      filter.accountManager = accountManagerParam;
    }

    if (leadStage) filter.leadStage = leadStage;

    const users = await User.find(filter)
      .populate("accountManager", "fullName email role")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users,
      loggedInRole: loggedInRole,
    });

  } catch (error) {
    console.error("Error in account-manager-leads:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   PUT - Assign Account Manager
========================= */
export async function PUT(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { userId, accountManagerId } = body;

    if (!userId || !accountManagerId) {
      return NextResponse.json(
        { success: false, error: "userId and accountManagerId required" },
        { status: 400 }
      );
    }

    // Validate manager role
    const manager = await Admin.findOne({
      _id: accountManagerId,
      role: "manager",
      isActive: true,
    });

    if (!manager) {
      return NextResponse.json(
        { success: false, error: "Invalid manager selected" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        accountManager: manager._id,
        accountManagerName: manager.fullName,
      },
      { new: true }
    ).populate("accountManager", "fullName email role");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}