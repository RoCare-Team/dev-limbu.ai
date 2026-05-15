import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import Admin from "@/models/Admin";
import User from "@/models/User";

/**
 * POST — superAdmin only:
 * Approve or reject a franchise revenue row.
 * Supports both:
 * - type: "user_onboard"
 * - type: "service"
 */
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, revenueId, decision } = body;

    // =========================
    // Validation
    // =========================
    if (!email || !revenueId || !decision) {
      return NextResponse.json(
        {
          success: false,
          message: "email, revenueId and decision are required",
        },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        {
          success: false,
          message: "decision must be approved or rejected",
        },
        { status: 400 }
      );
    }

    // =========================
    // Check Super Admin
    // =========================
    const admin = await Admin.findOne({
      email: String(email).toLowerCase().trim(),
    }).lean();

    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only superAdmin can approve payments",
        },
        { status: 403 }
      );
    }

    // =========================
    // Find Revenue Entry
    // =========================
    const rev = await FranchiseRevenue.findById(revenueId);

    // ✅ Allow both user_onboard and service
    if (!rev || !["user_onboard", "service"].includes(rev.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid onboard revenue entry",
        },
        { status: 400 }
      );
    }

    // =========================
    // Prevent Duplicate Decision
    // =========================
    const current = rev.planApprovalStatus || "pending";

    if (current === "approved" || current === "rejected") {
      return NextResponse.json(
        {
          success: false,
          message: "This entry was already decided",
        },
        { status: 400 }
      );
    }

    // =========================
    // Save Approval Status
    // =========================
    const nextStatus =
      decision === "approved" ? "approved" : "rejected";

    rev.planApprovalStatus = nextStatus;
    await rev.save();

    // =========================
    // USER_ONBOARD APPROVAL
    // =========================
    if (decision === "approved" && rev.type === "user_onboard") {
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
        { new: true }
      );
    }

    // =========================
    // SERVICE APPROVAL
    // =========================
    if (decision === "approved" && rev.type === "service") {
      const serviceName =
        rev.paidService?.trim() ||
        rev.plan?.trim() ||
        "Service";

      const now = new Date();

      // Monthly by default
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 1);

      await User.findOneAndUpdate(
        {
          $or: [
            { userId: rev.leadId },
            { email: rev.email },
          ],
        },
        {
          $set: {
            paidService: serviceName,
            isServiceBooked: true,
            serviceStatus: "active",
            serviceStartDate: now,
            serviceExpiryDate: expiry,
            leadStage: "Service",
          },
        },
        { new: true }
      );
    }

    // =========================
    // Response Message
    // =========================
    let message = "Approval updated successfully";

    if (decision === "approved") {
      if (rev.type === "user_onboard") {
        message = "Plan activated for user";
      } else if (rev.type === "service") {
        message = "Service activated for user";
      }
    } else {
      message = "Marked as not approved";
    }

    return NextResponse.json({
      success: true,
      message,
      revenue: rev.toObject(),
    });
  } catch (error) {
    console.error("Onboard approval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server error",
      },
      { status: 500 }
    );
  }
}