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

/**
 * Optional settlement window, from ?month=YYYY-MM or ?from=&to= (ISO dates).
 * Returns null when no window was asked for, which keeps the all-time behaviour.
 */
function parseWindow(searchParams) {
  const month = searchParams.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)), label: month };
  }

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  if (!fromRaw && !toRaw) return null;

  const from = fromRaw ? new Date(fromRaw) : new Date(0);
  // `to` is inclusive for the caller, exclusive for us — push it a day forward.
  const to = toRaw ? new Date(new Date(toRaw).getTime() + 24 * 60 * 60 * 1000) : new Date(8640000000000000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return { from, to, label: `${fromRaw || ""}..${toRaw || ""}` };
}

/** Revenue is counted in the month it was recorded. */
const revenueWindowMatch = (window) =>
  window ? { createdAt: { $gte: window.from, $lt: window.to } } : {};

/**
 * A payout belongs to the window it SETTLES (periodFrom), falling back to the
 * day it was paid when no period was entered — so money paid in April for
 * March's revenue is counted against March.
 */
const payoutWindowStages = (window) =>
  window
    ? [
        { $addFields: { effectiveAt: { $ifNull: ["$periodFrom", "$paidAt"] } } },
        { $match: { effectiveAt: { $gte: window.from, $lt: window.to } } },
      ]
    : [];

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
//  ?breakdown=1&franchiseCode= → the individual collections behind "Collected"
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("adminEmail");
    const wantsAll = searchParams.get("all");

    // Which clients the "Collected" figure is actually made of.
    //
    // The payout table showed one total per franchise with no way to see what
    // was inside it — payouts had a history, the money coming in did not. This
    // runs the SAME match the Collected column aggregates (same status filter,
    // same window), so the rows always add up to the number on screen.
    if (searchParams.get("breakdown")) {
      const franchiseCode = searchParams.get("franchiseCode");
      if (!franchiseCode) {
        return NextResponse.json(
          { success: false, message: "franchiseCode is required" },
          { status: 400 },
        );
      }

      // A franchise may read its own; an admin may read any.
      const tokenAccess = assertFranchiseBookingAccess(req);
      if (!tokenAccess.ok) {
        const adminAccess = await assertPayoutAdmin(adminEmail);
        if (!adminAccess.ok) {
          return NextResponse.json(
            { success: false, message: adminAccess.message },
            { status: adminAccess.status },
          );
        }
      }

      const window = parseWindow(searchParams);
      const entries = await FranchiseRevenue.find({
        franchiseId: franchiseCode,
        status: { $ne: "inactive" },
        ...revenueWindowMatch(window),
      })
        .select(
          "leadId leadName businessName amount plan email phone utrNumber " +
            "invoiceNumber invoiceUrl bookingSource onboardedByName status " +
            "paymentScreenshot screenshot packageStartDate packageExpiryDate createdAt",
        )
        .sort({ createdAt: -1 })
        .lean();

      const gross = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

      return NextResponse.json({
        success: true,
        data: entries,
        summary: {
          count: entries.length,
          gross,
          franchiseEarned: gross * SHARE_RATE,
          shareRate: SHARE_RATE,
        },
        period: window
          ? { from: window.from, to: window.to, label: window.label }
          : null,
      });
    }

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

      const window = parseWindow(searchParams);

      const [revenueRows, payoutRows, allTimeRevenueRows, allTimePayoutRows] =
        await Promise.all([
          FranchiseRevenue.aggregate([
            { $match: { status: { $ne: "inactive" }, ...revenueWindowMatch(window) } },
            { $group: { _id: "$franchiseId", gross: { $sum: "$amount" } } },
          ]),
          FranchisePayout.aggregate([
            { $match: { status: "paid" } },
            ...payoutWindowStages(window),
            {
              $group: {
                _id: "$franchiseCode",
                paid: { $sum: "$amount" },
                count: { $sum: 1 },
                lastPaidAt: { $max: "$paidAt" },
              },
            },
          ]),
          // All-time figures travel alongside so the row can still show the real
          // outstanding balance while a month is being settled.
          window
            ? FranchiseRevenue.aggregate([
                { $match: { status: { $ne: "inactive" } } },
                { $group: { _id: "$franchiseId", gross: { $sum: "$amount" } } },
              ])
            : Promise.resolve(null),
          window
            ? FranchisePayout.aggregate([
                { $match: { status: "paid" } },
                {
                  $group: {
                    _id: "$franchiseCode",
                    paid: { $sum: "$amount" },
                    count: { $sum: 1 },
                    lastPaidAt: { $max: "$paidAt" },
                  },
                },
              ])
            : Promise.resolve(null),
        ]);

      const revenueByCode = new Map(
        revenueRows.map((row) => [String(row._id || ""), row.gross || 0]),
      );
      const payoutByCode = new Map(
        payoutRows.map((row) => [String(row._id || ""), row]),
      );

      const allTimeRevenueByCode = new Map(
        (allTimeRevenueRows || []).map((row) => [String(row._id || ""), row.gross || 0]),
      );
      const allTimePayoutByCode = new Map(
        (allTimePayoutRows || []).map((row) => [String(row._id || ""), row]),
      );

      const data = franchises.map((franchise) => {
        const code = franchise.franchiseCode;
        const gross = revenueByCode.get(code) || 0;
        const payout = payoutByCode.get(code);

        const allTimeGross = window ? allTimeRevenueByCode.get(code) || 0 : gross;
        const allTimePayout = window ? allTimePayoutByCode.get(code) : payout;

        return {
          ...franchise,
          ...buildSummary(gross, payout?.paid || 0),
          payoutCount: payout?.count || 0,
          lastPaidAt: payout?.lastPaidAt || null,
          allTime: {
            ...buildSummary(allTimeGross, allTimePayout?.paid || 0),
            payoutCount: allTimePayout?.count || 0,
            lastPaidAt: allTimePayout?.lastPaidAt || null,
          },
        };
      });

      return NextResponse.json({
        success: true,
        data,
        period: window
          ? { from: window.from, to: window.to, label: window.label }
          : null,
      });
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
