import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import Admin from "@/models/Admin";
import User from "@/models/User";

/**
 * POST — superAdmin only: approve or reject a user_onboard revenue row; on approve, activate plan on User.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, revenueId, decision } = body;

    if (!email || !revenueId || !decision) {
      return NextResponse.json(
        { success: false, message: "email, revenueId and decision are required" },
        { status: 400 },
      );
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { success: false, message: "decision must be approved or rejected" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Only superAdmin can approve onboard payments" },
        { status: 403 },
      );
    }

    const rev = await FranchiseRevenue.findById(revenueId);
    if (
  !rev ||
  (rev.type !== "user_onboard" && rev.type !== "service")
) {
  return NextResponse.json(
    { success: false, message: "Invalid revenue entry" },
    { status: 400 },
  );
}

    const current = rev.planApprovalStatus || "pending";
    if (current === "approved" || current === "rejected") {
      return NextResponse.json(
        { success: false, message: "This entry was already decided" },
        { status: 400 },
      );
    }

    const nextStatus = decision === "approved" ? "approved" : "rejected";
    rev.planApprovalStatus = nextStatus;
    await rev.save();

    if (decision === "approved") {

  // =========================
  // 📦 PACKAGE APPROVAL
  // =========================
  if (rev.type === "user_onboard") {

    const planName = rev.plan?.trim() || "Premium Plan";

    const oneYearMs = 365 * 24 * 60 * 60 * 1000;

    const now = new Date();

    const expiry = new Date(now.getTime() + oneYearMs);

    await User.findOneAndUpdate(
      { userId: rev.leadId },

      {
        $set: {
          "subscription.plan": planName,
          "subscription.status": "active",
          "subscription.date": now,
          "subscription.expiry": expiry,

          paidPackage: planName,

          leadStage: "Onboard",
        },
      },

      { new: true },
    );
  }

  // =========================
  // 🛠 SERVICE APPROVAL
  // =========================
  if (rev.type === "service") {

    await User.findOneAndUpdate(
      { userId: rev.leadId },

      {
        $set: {

          packageStartDate: rev.packageStartDate,

          packageExpiryDate: rev.packageExpiryDate,

          paidService: rev.plan,

          serviceAmount: rev.amount,

          serviceStatus: "active",

          serviceApproval: "approved",

          serviceNotes: rev.notes || "",
        },
      },

      { new: true },
    );
  }
}

    return NextResponse.json({
      success: true,
      message:
        decision === "approved"
          ? "Plan activated for user"
          : "Marked as not approved — user plan unchanged",
      revenue: rev.toObject(),
    });
  } catch (error) {
    console.error("Onboard approval error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
