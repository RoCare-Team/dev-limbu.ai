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

    if (!rev) {
      return NextResponse.json(
        {
          success: false,
          message: "Revenue entry not found",
        },
        { status: 404 }
      );
    }

    // What the row's type decides is the SIDE EFFECT of approving it — never
    // whether a decision can be recorded at all. Rejecting is valid for every
    // row; approving activates a plan or a service only where that makes sense.
    const PLAN_TYPES = ["user_onboard", "plan"];
    const SERVICE_TYPES = ["service"];

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
    if (decision === "approved" && PLAN_TYPES.includes(rev.type)) {
      const planName = rev.plan?.trim() || "Premium Plan";

      // The row usually carries the window the customer actually bought; only
      // fall back to "a year from now" when it does not.
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      const now = rev.packageStartDate ? new Date(rev.packageStartDate) : new Date();
      const expiry = rev.packageExpiryDate
        ? new Date(rev.packageExpiryDate)
        : new Date(now.getTime() + oneYearMs);

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
    if (decision === "approved" && SERVICE_TYPES.includes(rev.type)) {
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
      if (PLAN_TYPES.includes(rev.type)) {
        message = "Plan activated for user";
      } else if (SERVICE_TYPES.includes(rev.type)) {
        message = "Service activated for user";
      } else {
        // e.g. franchise_lead — the decision is recorded, nothing is activated.
        message = "Marked as approved";
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