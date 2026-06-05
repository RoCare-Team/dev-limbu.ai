import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  assertFranchiseBookingAccess,
  assertFranchiseBookingWriteAccess,
} from "@/lib/franchiseAuthServer";

import FranchiseRevenue from "@/models/FranchiseRevenue";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { getServerSession } from "next-auth";


// ==================
// GET: FETCH REVENUE DATA (ROLE-BASED)
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    // ✅ NEW: franchiseCode param check — ServiceBookingList ke liye
    const franchiseCode = searchParams.get("franchiseCode");

    if (franchiseCode) {
      const access = assertFranchiseBookingAccess(req);
      if (!access.ok) {
        return NextResponse.json(
          { success: false, message: access.message },
          { status: access.status },
        );
      }

      const type = searchParams.get("type");
      const dateFilter = searchParams.get("dateFilter");
      const startDateParam = searchParams.get("startDate");
      const endDateParam = searchParams.get("endDate");

      let dateMatchQuery = {};
      if (
        dateFilter &&
        startDateParam &&
        endDateParam &&
        dateFilter !== "all"
      ) {
        const startDate = new Date(startDateParam);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
        dateMatchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
      }

      let revenueData = await FranchiseRevenue.find({
        franchiseId: franchiseCode, // ✅ model mein franchiseId: String
        status: { $ne: "inactive" },
        ...dateMatchQuery,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (type) {
        revenueData = revenueData.filter((item) => item.type === type);
      }

      const totalRevenue = revenueData.reduce(
        (sum, rev) => sum + (Number(rev.amount) || 0),
        0,
      );

      return NextResponse.json({
        success: true,
        data: revenueData, // ✅ json.data — component ke saath match
        revenue: revenueData,
        totalRevenue,
        franchiseShare: totalRevenue * 0.5,
        providerShare: totalRevenue * 0.5,
        count: revenueData.length,
      });
    }
    // ✅ END franchiseCode block — existing logic neeche bilkul same hai

    const email = searchParams.get("email");
    const role = searchParams.get("role");

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: "Email and role are required" },
        { status: 400 },
      );
    }

    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateMatchQuery = {};
    if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      dateMatchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Find the admin
    const admin = await Admin.findOne({ email }).lean();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 },
      );
    }

    let revenueData;
    let totalRevenue = 0;

    // Separate breakdowns
    let userOnboardRevenue = 0;
    let franchiseLeadRevenue = 0;
    let userOnboardCount = 0;
    let franchiseLeadCount = 0;
    let paidLeads = [];

    // SuperAdmin: See ALL revenue (both user onboarding and franchise leads)
    if (role === "superAdmin" || role === "superFranchiseAdmin") {
      revenueData = await FranchiseRevenue.find({
        status: { $in: ["active", "user_onboard"] },
        ...dateMatchQuery,
      })
        .populate("onboardedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .lean();

      totalRevenue = revenueData.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0,
      );

      userOnboardRevenue = revenueData
        .filter((rev) => rev.type === "user_onboard")
        .reduce((sum, rev) => sum + (rev.amount || 0), 0);

      franchiseLeadRevenue = revenueData
        .filter((rev) => rev.type === "franchise_lead")
        .reduce((sum, rev) => sum + (rev.amount || 0), 0);

      userOnboardCount = revenueData.filter(
        (rev) => rev.type === "user_onboard",
      ).length;

      franchiseLeadCount = revenueData.filter(
        (rev) => rev.type === "franchise_lead",
      ).length;

      paidLeads = revenueData
        .filter((rev) => rev.type === "franchise_lead")
        .map((rev) => rev.leadId);
    }

    // FranchiseAdmin: See only their own franchise lead revenue
    else if (role === "franchiseAdmin") {
      revenueData = await FranchiseRevenue.find({
        onboardedBy: admin._id,
        status: "user_onboard",
        type: { $ne: "user_onboard" },
        ...dateMatchQuery,
      })
        .populate("onboardedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .lean();

      totalRevenue = revenueData.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0,
      );

      franchiseLeadRevenue = totalRevenue;
      franchiseLeadCount = revenueData.length;

      paidLeads = revenueData.map((rev) => rev.leadId);
    }

    // Agent: See only their own user onboarding revenue
    else if (role === "agent") {
      revenueData = await FranchiseRevenue.find({
        onboardedBy: admin._id,
        status: "active",
        type: "user_onboard",
        ...dateMatchQuery,
      })
        .populate("onboardedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .lean();

      totalRevenue = revenueData.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0,
      );

      userOnboardRevenue = totalRevenue;
      userOnboardCount = revenueData.length;
    } else {
      return NextResponse.json(
        { success: false, message: "Unauthorized role" },
        { status: 403 },
      );
    }

    /* 🔥 USER EXPIRY FETCH FOR ALL ROLES */

    const userIds = revenueData.map((item) => item.leadId);

    const users = await User.find({
      userId: { $in: userIds },
    })
      .select("userId packageExpiryDate packageStartDate")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[String(user.userId).trim()] = user;
    });

    revenueData = revenueData.map((item) => ({
      ...item,
      userPackageExpiryDate:
        userMap[String(item.leadId).trim()]?.packageExpiryDate || null,
      userPackageStartDate:
        userMap[String(item.leadId).trim()]?.packageStartDate || null,
    }));

    return NextResponse.json({
      success: true,
      revenue: revenueData,
      totalRevenue,
      totalUserOnboardRevenue: userOnboardRevenue,
      totalFranchiseRevenue: franchiseLeadRevenue,
      userOnboardCount,
      franchiseLeadCount,
      count: revenueData.length,
      paidLeads,
    });
  } catch (error) {
    console.error("Revenue Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ==================
// POST: ADD NEW REVENUE ENTRY
// ==================
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    console.log("API RECEIVED:", body);

    const writeAccess = assertFranchiseBookingWriteAccess(req, body);
    if (!writeAccess.ok) {
      return NextResponse.json(
        { success: false, message: writeAccess.message },
        { status: writeAccess.status },
      );
    }

    const {
      leadId,
      leadName,
      amount,
      paymentScreenshot,
      email,
      userEmail,
      phone,
      notes,
      planRemarks,
      plan,
      type,
      status,
      utrNumber,
      gstNumber,
      packageStartDate,
      packageExpiryDate,
      franchiseId,
      franchiseName,
      bookingSource,
    } = body;

    // ✅ Validation — paymentScreenshot optional rakho franchise ke liye
    if (!leadId || !leadName || !amount) {
      return NextResponse.json(
        { success: false, message: "leadId, leadName and amount are required" },
        { status: 400 },
      );
    }

    // ✅ Admin dhundo — agar nahi mila to franchiseId se kaam chalao
    let admin = null;
    if (email) {
      admin = await Admin.findOne({ email }).lean();
    }

    const newRevenue = new FranchiseRevenue({
      leadId,
      leadName,
      amount: parseFloat(amount),
      paymentScreenshot: paymentScreenshot || "",
      screenshot: paymentScreenshot || "",

      // ✅ admin mile to use karo, nahi mila to null rakho
      onboardedBy: admin?._id?.toString() || franchiseId || "",
      onboardedByName: admin?.fullName || franchiseName || "",
      onboardedByRole: admin?.role || "franchiseAdmin",

      email: userEmail || "",
      phone: phone || "",
      notes: notes || "",
      planRemarks: planRemarks || "",
      plan: plan || "",
      packageStartDate: packageStartDate ? new Date(packageStartDate) : null,
      packageExpiryDate: packageExpiryDate ? new Date(packageExpiryDate) : null,
      utrNumber: utrNumber || "",
      gstNumber: gstNumber || "",

      // ✅ franchise fields
      franchiseId: franchiseId || null,
      franchiseName: franchiseName || null,
      bookingSource: bookingSource || "manual-upload",

      ...(type === "user_onboard" ? { planApprovalStatus: "pending" } : {}),
      type: type || "franchise_lead",
      status: status || "user_onboard",
    });

    await newRevenue.save();

    await User.findOneAndUpdate(
      { userId: leadId },
      {
        $set: {
          packageStartDate: packageStartDate
            ? new Date(packageStartDate)
            : null,
          packageExpiryDate: packageExpiryDate
            ? new Date(packageExpiryDate)
            : null,
          paidService: plan || "",
          amount: Number(amount) || 0,
          isServiceBooked: true,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Revenue added successfully",
      revenue: newRevenue,
    });
  } catch (error) {
    console.error("Revenue Add Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ==================
// PATCH: UPDATE REVENUE STATUS
// ==================
export async function PATCH(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { revenueId, status } = body;

    if (!revenueId || !status) {
      return NextResponse.json(
        { success: false, message: "Revenue ID and status are required" },
        { status: 400 },
      );
    }

    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 },
      );
    }

    const updatedRevenue = await FranchiseRevenue.findByIdAndUpdate(
      revenueId,
      { status },
      { new: true },
    ).lean();

    if (!updatedRevenue) {
      return NextResponse.json(
        { success: false, message: "Revenue entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Revenue status updated",
      revenue: updatedRevenue,
    });
  } catch (error) {
    console.error("Revenue Update Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      id,
      plan,
      amount,
      notes,
      planRemarks,
      packageStartDate,
      packageExpiryDate,
      type,
      gstNumber, // 🔥 ADD THIS
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 },
      );
    }

    // ========================
    // 🔥 SERVICE UPDATE
    // ========================

    if (type === "service") {
      // ✅ Service records FranchiseRevenue collection me stored hote hain
      const updatedRevenue = await FranchiseRevenue.findByIdAndUpdate(
        id,
        {
          ...(amount !== undefined && { amount: Number(amount) || 0 }),

          ...(notes !== undefined && { notes }),
          ...(notes !== undefined && { remarks: notes }),

          ...(packageStartDate && {
            packageStartDate: new Date(packageStartDate),
          }),

          ...(packageExpiryDate && {
            packageExpiryDate: new Date(packageExpiryDate),
          }),
        },
        { new: true },
      );

      if (!updatedRevenue) {
        return NextResponse.json(
          {
            success: false,
            message: "Service record not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Service updated successfully",
        revenue: updatedRevenue,
      });
    }

    // ========================
    // 📦 PACKAGE UPDATE
    // ========================
    const updated = await FranchiseRevenue.findByIdAndUpdate(
      id,
      {
        ...(plan && { plan }),
        ...(amount && { amount }),
        ...(notes && { notes }),
        ...(planRemarks && { planRemarks }),

        ...(gstNumber !== undefined && { gstNumber }),

        ...(packageStartDate && {
          packageStartDate: new Date(packageStartDate),
        }),
        ...(packageExpiryDate && {
          packageExpiryDate: new Date(packageExpiryDate),
        }),
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      revenue: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
// ==================
// DELETE: DELETE REVENUE ENTRY
// ==================

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 },
      );
    }

    // 🔥 SERVICE DELETE
    if (type === "service") {
      const deleted = await FranchiseRevenue.findByIdAndUpdate(
        id,
        {
          status: "inactive",
        },
        {
          new: true,
        },
      );

      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            message: "Service record not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Service deleted successfully",
      });
    }

    // 📦 PACKAGE DELETE
    const deleted = await FranchiseRevenue.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);

    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 },
    );
  }
}
