import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import FranchiseInquiry from "@/models/FranchiseInquiry";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/* ─────────────────────────────────────────────────────────────
   POST  /api/franchise-panel/sesi-leads
   Called from franchise-opportunities form.
   Resolves franchiseCode  → FranchisePanel  (e.g. FD004)
   Resolves referCode      → FranchiseTeam   (Sales Executive / SESI)
   Priority: Sales Executive first, then franchise code.
   Saves lead in FranchiseInquiry (SESI data).
───────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name,
      email,
      phone,
      city,
      investment,
      plan,
      paymentId,
      orderId,
      amount,
      status,
      gstNumber,
      franchiseCode,  // e.g. "FD004"  – franchise-level code from URL / form
      referCode,      // e.g. "JOHN1234" – sales executive referral code from URL
    } = body;

    if (!name || !email || !phone || !city) {
      return NextResponse.json(
        { success: false, message: "Please fill all required fields" },
        { status: 400 }
      );
    }

    // ── 1. Resolve Sales Executive (SESI) via referCode ──────────
    let salesExecutiveId = null;
    let salesExecutiveName = null;
    let salesExecutiveReferralCode = null;
    let resolvedFranchiseCode = franchiseCode ? franchiseCode.toUpperCase() : null;
    let franchisePanelId = null;
    let sourceType = "direct";

    if (referCode) {
      const teamMember = await FranchiseTeam.findOne({
        referralCode: referCode.toUpperCase(),
        isActive: true,
      });

      if (teamMember) {
        salesExecutiveId = teamMember._id;
        salesExecutiveName = teamMember.fullName;
        salesExecutiveReferralCode = teamMember.referralCode;
        // Sales Executive is always tied to a franchise — inherit if not already set
        if (!resolvedFranchiseCode) {
          resolvedFranchiseCode = teamMember.franchiseId
            ? teamMember.franchiseId.toUpperCase()
            : null;
        }
        sourceType = "sales_executive";
      }
    }

    // ── 2. Resolve Franchise Panel via franchiseCode ─────────────
    if (resolvedFranchiseCode) {
      const franchisePanel = await FranchisePanel.findOne({
        franchiseCode: resolvedFranchiseCode,
      });

      if (franchisePanel) {
        franchisePanelId = franchisePanel._id;
        resolvedFranchiseCode = franchisePanel.franchiseCode; // use DB-normalised value
        if (sourceType === "direct") sourceType = "franchise_code";
      }
    }

    // ── 3. Save to FranchiseInquiry (SESI / primary record) ──────
    const inquiry = await FranchiseInquiry.create({
      fullName: name,
      email,
      phone,
      city,
      investmentCapacity: investment || "",
      plan: plan || null,
      paymentId: paymentId || null,
      orderId: orderId || null,
      amount: amount || null,
      gstNumber: gstNumber || null,
      status: "pending",

      // Franchise tracking
      franchiseCode: resolvedFranchiseCode,
      franchisePanelId,

      // Sales Executive tracking
      salesExecutiveReferralCode,
      salesExecutiveId,
      salesExecutiveName,

      sourceType,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        data: inquiry,
        tracking: {
          franchiseCode: resolvedFranchiseCode,
          salesExecutive: salesExecutiveName,
          sourceType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SESI Leads POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   GET  /api/franchise-panel/sesi-leads
   Role-based visibility (reads JWT from Authorization header):
     • role "franchise"           → all inquiries for their franchiseCode
     • role "superFranchiseAdmin" → all inquiries for their franchiseCode
     • role "manager"             → all inquiries for their franchiseCode
     • role "agent"               → only inquiries where salesExecutiveId = their id
   No token / unrecognised role   → 401
───────────────────────────────────────────────────────────── */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
    } catch (_) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const role = decoded.role;
    let query = {};

    if (role === "franchise") {
      // Franchise Admin — sees all leads for their franchise code
      query.franchiseCode = decoded.franchiseCode;
    } else if (role === "superFranchiseAdmin" || role === "manager") {
      // Senior team roles — see all leads for their franchise
      query.franchiseCode = decoded.franchiseCode;
    } else if (role === "agent") {
      // Sales Executive — sees only leads they personally referred
      query.salesExecutiveId = decoded.id;
    } else {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Optional query-param filters
    const filterStatus = searchParams.get("status");
    const filterSource = searchParams.get("sourceType");
    const filterSearch = searchParams.get("search");

    if (filterStatus) query.status = filterStatus;
    if (filterSource) query.sourceType = filterSource;
    if (filterSearch) {
      query.$or = [
        { fullName: { $regex: filterSearch, $options: "i" } },
        { email: { $regex: filterSearch, $options: "i" } },
        { phone: { $regex: filterSearch, $options: "i" } },
        { city: { $regex: filterSearch, $options: "i" } },
      ];
    }

    const leads = await FranchiseInquiry.find(query)
      .populate("franchisePanelId", "franchiseName franchiseCode ownerName")
      .populate("salesExecutiveId", "fullName email mobile referralCode")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: leads, total: leads.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("SESI Leads GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH  /api/franchise-panel/sesi-leads
   Update lead status (franchise admin / manager only).
   Body: { id, status }
───────────────────────────────────────────────────────────── */
export async function PATCH(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
    } catch (_) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const allowedRoles = ["franchise", "superFranchiseAdmin", "manager"];
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "id and status are required" },
        { status: 400 }
      );
    }

    const updated = await FranchiseInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("SESI Leads PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
