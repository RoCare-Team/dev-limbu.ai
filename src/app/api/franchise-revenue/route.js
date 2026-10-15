import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  assertFranchiseBookingAccess,
  assertFranchiseBookingWriteAccess,
} from "@/lib/franchiseAuthServer";

import FranchiseRevenue from "@/models/FranchiseRevenue";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { generateInvoicePDFBuffer } from "@/app/api/admin/invoice-tax/route"; 
import { uploadToS3 } from "@/utils/s3Config";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    // ✅ franchiseCode param check — ServiceBookingList ke liye
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
        franchiseId: franchiseCode,
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
        data: revenueData,
        revenue: revenueData,
        totalRevenue,
        franchiseShare: totalRevenue * 0.5,
        providerShare: totalRevenue * 0.5,
        count: revenueData.length,
      });
    }

    // ✅ NEW: userId param — specific user ki saari revenue entries
    const userId = searchParams.get("userId");

    if (userId) {
      const revenueData = await FranchiseRevenue.find({
        leadId: userId, // leadId se userId match karo
        status: { $ne: "inactive" },
      })
        .sort({ createdAt: -1 })
        .lean();

      const totalAmount = revenueData.reduce(
        (sum, rev) => sum + (Number(rev.amount) || 0),
        0,
      );

      return NextResponse.json({
        success: true,
        data: revenueData,
        count: revenueData.length,
        totalAmount,
      });
    }

    // ✅ Role-based fetch — email + role required
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

    const admin = await Admin.findOne({ email }).lean();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 },
      );
    }

    let revenueData;
    let totalRevenue = 0;
    let userOnboardRevenue = 0;
    let franchiseLeadRevenue = 0;
    let userOnboardCount = 0;
    let franchiseLeadCount = 0;
    let paidLeads = [];

    if ((role === "superAdmin" || role === "seniorManager") || role === "superFranchiseAdmin") {
      revenueData = await FranchiseRevenue.find({
        status: { $in: ["active", "user_onboard"] },
        ...dateMatchQuery,
      })
        .populate("onboardedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .lean();

      totalRevenue = revenueData
        .filter(
          (rev) =>
            rev.type === "user_onboard" ||
            rev.type === "plan" ||
            rev.type === "service",
        )
        .reduce((sum, rev) => sum + Number(rev.amount || 0), 0);

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
    } else if (role === "franchiseAdmin") {
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
    } else if (role === "agent") {
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

    // 🔥 USER EXPIRY FETCH FOR ALL ROLES
    const userIds = revenueData.map((item) => item.leadId);

    const users = await User.find({ userId: { $in: userIds } })
      .select("userId packageExpiryDate packageStartDate paidPackage email")
      .lean();

    const userMap = {};
    users.forEach((user) => {
      userMap[String(user.userId).trim()] = user;
    });

    revenueData = revenueData.map((item) => ({
      ...item,
      // Fall back to the User record's email when the revenue entry has none
      email: item.email || userMap[String(item.leadId).trim()]?.email || "",
      userPackageExpiryDate:
        userMap[String(item.leadId).trim()]?.packageExpiryDate || null,
      userPackageStartDate:
        userMap[String(item.leadId).trim()]?.packageStartDate || null,
      userPaidPackage:
        userMap[String(item.leadId).trim()]?.paidPackage || null,
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
      businessName,
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

    if (!leadId || !leadName || !amount) {
      return NextResponse.json(
        { success: false, message: "leadId, leadName and amount are required" },
        { status: 400 },
      );
    }

    let admin = null;
    if (email) {
      admin = await Admin.findOne({ email }).lean();
    }

    const newRevenue = new FranchiseRevenue({
      leadId,
      leadName,
      businessName: (businessName || "").trim(),
      amount: parseFloat(amount),
      paymentScreenshot: paymentScreenshot || "",
      screenshot: paymentScreenshot || "",

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

      franchiseId: franchiseId || null,
      franchiseName: franchiseName || null,
      bookingSource: bookingSource || "manual-upload",

      ...(type === "user_onboard" ? { planApprovalStatus: "pending" } : {}),
      type: type || "franchise_lead",
      status: status || "user_onboard",
    });

    await newRevenue.save();

    // Keep the client's business name on the user too — onboarding is the one
    // moment it is known for sure, and every later screen reads the user.
    if (businessName && String(businessName).trim() && leadId) {
      try {
        await User.updateOne(
          { userId: leadId },
          { $set: { businessName: String(businessName).trim() } },
        );
      } catch (err) {
        // A failed copy must not lose the onboarding that was just recorded.
        console.error("Could not copy businessName onto the user:", err);
      }
    }

    let updatedRevenue = newRevenue;

    console.log({
      ...newRevenue.toObject(),
      userEmail: userEmail || "",
      userPhone: phone || "",
    });

    try {
      const invoiceBuffer = await generateInvoicePDFBuffer({
        ...newRevenue.toObject(),
        userEmail: userEmail || "",
        userPhone: phone || "",
      });

      const s3Result = await uploadToS3(
        invoiceBuffer,
        `invoice-${newRevenue._id}.pdf`,
        "application/pdf",
      );

      if (s3Result.success) {
        await FranchiseRevenue.findByIdAndUpdate(
          newRevenue._id,
          {
            invoiceUrl: s3Result.url,
          },
          { new: true }
        );
      }

      updatedRevenue = await FranchiseRevenue.findById(
        newRevenue._id
      ).lean();

    } catch (invoiceErr) {
      console.error("Invoice generation/upload failed:", invoiceErr);
    }

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
      revenue: updatedRevenue,
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

// ==================
// PUT: UPDATE REVENUE DETAILS
// ==================
export async function PUT(req) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const id = formData.get("id");
    const plan = formData.get("plan");
    const email = formData.get("email");
    const amount = formData.get("amount");
    const planRemarks = formData.get("planRemarks");
    const packageStartDate = formData.get("packageStartDate");
    const packageExpiryDate = formData.get("packageExpiryDate");
    const paymentScreenshot = formData.get("paymentScreenshot");

    const type = formData.get("type");
    const gstNumber = formData.get("gstNumber");
    const notes = formData.get("notes");

    // NEW: Retrieving newly added fields from formData
    const utrNumber = formData.get("utrNumber");
    const planDuration = formData.get("planDuration");

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
      let screenshotUrl = null;

      if (
        paymentScreenshot &&
        typeof paymentScreenshot === "object" &&
        paymentScreenshot.name
      ) {
        const bytes = await paymentScreenshot.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToS3(
          buffer,
          paymentScreenshot.name,
          paymentScreenshot.type,
        );

        if (uploadResult?.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      const updatedServiceData = {
        ...(amount !== undefined && {
          amount: Number(amount) || 0,
        }),

        ...(notes !== undefined && { notes }),
        ...(notes !== undefined && { remarks: notes }),

        ...(packageStartDate && {
          packageStartDate: new Date(packageStartDate),
        }),

        ...(packageExpiryDate && {
          packageExpiryDate: new Date(packageExpiryDate),
        }),

        ...(screenshotUrl && {
          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,
        }),

        // UPDATED: Injected support for saving incoming GST, UTR, and Plan Duration values
        ...(gstNumber !== undefined && { gstNumber }),
        ...(utrNumber !== undefined && { utrNumber }),
        ...(planDuration !== undefined && { planDuration }),
      };

      const updatedRevenue = await FranchiseRevenue.findByIdAndUpdate(
        id,
        updatedServiceData,
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
    let screenshotUrl = null;

    if (
      paymentScreenshot &&
      typeof paymentScreenshot === "object" &&
      paymentScreenshot.name
    ) {
      const bytes = await paymentScreenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await uploadToS3(
        buffer,
        paymentScreenshot.name,
        paymentScreenshot.type,
      );

      if (uploadResult?.success) {
        screenshotUrl = uploadResult.url;
      }
    }

    const updatedPackageData = {
      ...(plan && { plan }),
      ...(email !== undefined && email !== null && { email }),
      ...(amount !== null && amount !== undefined && amount !== "" && {
        amount: Number(amount) || 0,
      }),
      // formData.get() returns null when the field was not sent; an empty string
      // is a deliberate "clear the remark", so only null means "leave as is".
      ...(planRemarks !== null && planRemarks !== undefined && { planRemarks }),
      ...(notes !== null && notes !== undefined && { notes }),

      ...(screenshotUrl && {
        paymentScreenshot: screenshotUrl,
        screenshot: screenshotUrl,
      }),

      ...(packageStartDate && {
        packageStartDate: new Date(packageStartDate),
      }),

      ...(packageExpiryDate && {
        packageExpiryDate: new Date(packageExpiryDate),
      }),

      // OPTIONAL HELPER: Adding GST and UTR support to package updates as well
      ...(gstNumber !== undefined && { gstNumber }),
      ...(utrNumber !== undefined && { utrNumber }),
    };

    const updated = await FranchiseRevenue.findByIdAndUpdate(
      id,
      updatedPackageData,
      { new: true },
    );

    // 🔥 USER COLLECTION UPDATE
    // Only touch the user's package dates when this request actually carries
    // them — an edit that changes just the amount/remark used to blank them out.
    const userUpdate = {
      ...(packageStartDate && { packageStartDate: new Date(packageStartDate) }),
      ...(packageExpiryDate && {
        packageExpiryDate: new Date(packageExpiryDate),
      }),
      ...(email !== undefined && email !== null && { email }),
    };

    if (updated?.leadId && Object.keys(userUpdate).length) {
      await User.findOneAndUpdate({ userId: updated.leadId }, { $set: userUpdate });
    }

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