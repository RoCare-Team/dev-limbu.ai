import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

import Admin from "@/models/Admin";
import FranchisePanel from "@/models/franchisePanel";
import FranchisePayout from "@/models/FranchisePayout";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import { assertFranchiseBookingAccess } from "@/lib/franchiseAuthServer";

/** Franchise keeps 50% of collected revenue. Mirrors the revenue-share UI. */
const SHARE_RATE = 0.5;

const PAYOUT_ADMIN_ROLES = ["superAdmin", "superFranchiseAdmin"];

/**
 * Admin identity comes from the `adminEmail` param and is verified against the
 * Admin collection — the panel itself only keeps role/email in localStorage.
 */
async function assertPayoutAdmin(email) {
  if (!email) {
    return { ok: false, status: 401, message: "Admin email is required" };
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase() })
    .select("fullName email role")
    .lean();

  if (!admin) {
    return { ok: false, status: 401, message: "Admin not found" };
  }

  if (!PAYOUT_ADMIN_ROLES.includes(admin.role)) {
    return {
      ok: false,
      status: 403,
      message: "Only super admin can manage franchise payouts",
    };
  }

  return { ok: true, admin };
}

/** Gross revenue collected for a franchise (same filter the panel uses). */
async function getGrossRevenue(franchiseCode) {
  const [row] = await FranchiseRevenue.aggregate([
    { $match: { franchiseId: franchiseCode, status: { $ne: "inactive" } } },
    { $group: { _id: null, gross: { $sum: "$amount" } } },
  ]);
  return row?.gross || 0;
}

async function getPaidTotal(franchiseCode) {
  const [row] = await FranchisePayout.aggregate([
    { $match: { franchiseCode, status: "paid" } },
    { $group: { _id: null, paid: { $sum: "$amount" } } },
  ]);
  return row?.paid || 0;
}

function buildSummary(gross, paid) {
  const earned = gross * SHARE_RATE;
  return {
    shareRate: SHARE_RATE,
    grossRevenue: gross,
    franchiseEarned: earned,
    providerShare: gross - earned,
    totalPaid: paid,
    pending: Math.max(0, earned - paid),
  };
}

// ==================
// GET
//  ?franchiseCode=X            → one franchise (franchise token OR admin)
//  ?all=1&adminEmail=...       → every franchise's earned / paid / pending
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("adminEmail");
    const wantsAll = searchParams.get("all");

    if (wantsAll) {
      const access = await assertPayoutAdmin(adminEmail);
      if (!access.ok) {
        return NextResponse.json(
          { success: false, message: access.message },
          { status: access.status },
        );
      }

      const franchises = await FranchisePanel.find({})
        .select("franchiseName franchiseCode ownerName email mobileNumber isActive")
        .sort({ franchiseName: 1 })
        .lean();

      const [revenueRows, payoutRows] = await Promise.all([
        FranchiseRevenue.aggregate([
          { $match: { status: { $ne: "inactive" } } },
          { $group: { _id: "$franchiseId", gross: { $sum: "$amount" } } },
        ]),
        FranchisePayout.aggregate([
          { $match: { status: "paid" } },
          {
            $group: {
              _id: "$franchiseCode",
              paid: { $sum: "$amount" },
              count: { $sum: 1 },
              lastPaidAt: { $max: "$paidAt" },
            },
          },
        ]),
      ]);

      const revenueByCode = new Map(
        revenueRows.map((row) => [String(row._id || ""), row.gross || 0]),
      );
      const payoutByCode = new Map(
        payoutRows.map((row) => [String(row._id || ""), row]),
      );

      const data = franchises.map((franchise) => {
        const code = franchise.franchiseCode;
        const gross = revenueByCode.get(code) || 0;
        const payout = payoutByCode.get(code);

        return {
          ...franchise,
          ...buildSummary(gross, payout?.paid || 0),
          payoutCount: payout?.count || 0,
          lastPaidAt: payout?.lastPaidAt || null,
        };
      });

      return NextResponse.json({ success: true, data });
    }

    const franchiseCode = searchParams.get("franchiseCode");
    if (!franchiseCode) {
      return NextResponse.json(
        { success: false, message: "franchiseCode is required" },
        { status: 400 },
      );
    }

    // Either the franchise itself (bearer token) or a super admin may read this.
    const tokenAccess = assertFranchiseBookingAccess(req);
    if (!tokenAccess.ok) {
      const adminAccess = await assertPayoutAdmin(adminEmail);
      if (!adminAccess.ok) {
        return NextResponse.json(
          { success: false, message: tokenAccess.message },
          { status: tokenAccess.status },
        );
      }
    }

    const [payouts, gross, paid] = await Promise.all([
      FranchisePayout.find({ franchiseCode, status: "paid" })
        .sort({ paidAt: -1, createdAt: -1 })
        .lean(),
      getGrossRevenue(franchiseCode),
      getPaidTotal(franchiseCode),
    ]);

    return NextResponse.json({
      success: true,
      data: payouts,
      summary: buildSummary(gross, paid),
    });
  } catch (error) {
    console.error("Franchise payout GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ==================
// POST — record a payout (super admin only)
// ==================
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const access = await assertPayoutAdmin(body.adminEmail);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status },
      );
    }

    const franchiseCode = String(body.franchiseCode || "").trim();
    const amount = Number(body.amount);

    if (!franchiseCode) {
      return NextResponse.json(
        { success: false, message: "franchiseCode is required" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Enter a valid payout amount" },
        { status: 400 },
      );
    }

    const franchise = await FranchisePanel.findOne({ franchiseCode })
      .select("franchiseName franchiseCode")
      .lean();

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 },
      );
    }

    if (!body.screenshot) {
      return NextResponse.json(
        { success: false, message: "Payment proof screenshot is required" },
        { status: 400 },
      );
    }

    const payout = await FranchisePayout.create({
      franchiseCode,
      franchiseName: franchise.franchiseName || "",
      amount,
      paymentMode: body.paymentMode || "bank-transfer",
      referenceNo: String(body.referenceNo || "").trim(),
      screenshot: body.screenshot,
      notes: String(body.notes || "").trim(),
      periodFrom: body.periodFrom ? new Date(body.periodFrom) : null,
      periodTo: body.periodTo ? new Date(body.periodTo) : null,
      paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      createdByEmail: access.admin.email,
      createdByName: access.admin.fullName || "",
    });

    const [gross, paid] = await Promise.all([
      getGrossRevenue(franchiseCode),
      getPaidTotal(franchiseCode),
    ]);

    return NextResponse.json({
      success: true,
      message: "Payout recorded successfully",
      payout,
      summary: buildSummary(gross, paid),
    });
  } catch (error) {
    console.error("Franchise payout POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ==================
// DELETE — reverse a payout (super admin only)
// ==================
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminEmail = searchParams.get("adminEmail");

    const access = await assertPayoutAdmin(adminEmail);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status },
      );
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Valid payout id is required" },
        { status: 400 },
      );
    }

    const payout = await FranchisePayout.findByIdAndUpdate(
      id,
      { status: "reversed" },
      { new: true },
    );

    if (!payout) {
      return NextResponse.json(
        { success: false, message: "Payout not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payout reversed",
      payout,
    });
  } catch (error) {
    console.error("Franchise payout DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
