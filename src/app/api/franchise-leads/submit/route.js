import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Lead from "@/models/MetaLeadFranchises";
import Admin from "@/models/Admin";

// ---- Round-robin setting store (same collection Meta sync uses) ----
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});
const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

// Shared with Meta franchise sync so external + Meta leads rotate together.
const FRANCHISE_RR_KEY = "metaFranchiseLeadRR";

// Atomically increment the round-robin counter and return the new doc.
async function bumpFranchiseRoundRobin() {
  return Setting.findOneAndUpdate(
    { key: FRANCHISE_RR_KEY },
    [
      {
        $set: {
          key: FRANCHISE_RR_KEY,
          value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
        },
      },
    ],
    { new: true, upsert: true },
  );
}

// Pick the next active franchiseAdmin via round-robin (same as Meta leads).
async function getNextFranchiseAdminId() {
  const franchiseAdmins = await Admin.find({
    role: "franchiseAdmin",
    isActive: true,
  }).sort({ createdAt: 1, _id: 1 });

  if (!franchiseAdmins.length) return null;

  const rrDoc = await bumpFranchiseRoundRobin();
  let rrValue = parseInt(rrDoc?.value, 10);
  if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

  const index = rrValue % franchiseAdmins.length;
  return franchiseAdmins[index]._id;
}

// ==========================================================
// PUBLIC INTAKE ENDPOINT FOR EXTERNAL SOURCES (e.g. limbu.ai)
// ----------------------------------------------------------
// POST /api/franchise-leads/submit
//
// Sends a franchise lead from an external website/form and
// saves it into the franchise leads database.
//
// NOTE: Leads are stored under the SAME formId that the CRM
// dashboard reads ("1213106820766164"), so external leads show
// up alongside Meta leads. The "source" field keeps them
// distinguishable (e.g. "limbu.ai" / "chatbot").
//
// Example payload (JSON body):
// {
//   "full_name": "Ramesh Kumar",
//   "email": "ramesh@example.com",
//   "phone": "9876543210",
//   "city": "Jaipur",
//   "occupation": "Business",
//   "investment": "10-20 Lakh",
//   "source": "limbu.ai"
// }
// ==========================================================

// formId the CRM dashboard fetches by. External leads use this same
// id so they appear in the dashboard; "source" tells them apart.
const CRM_FORM_ID = "1213106820766164";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    // Accept both snake_case and camelCase keys for flexibility
    const fullName = (body.full_name ?? body.fullName ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const phone = (body.phone ?? body.phone_number ?? "").toString().trim();
    const city = (body.city ?? "").toString().trim();
    const occupation = (body.occupation ?? "").toString().trim();
    const investment = (
      body.investment ??
      body.investment_range ??
      body.mention_investment_rang ??
      ""
    )
      .toString()
      .trim();
    const source = (body.source ?? "limbu.ai").toString().trim();

    // ---- Basic validation ----
    if (!fullName && !phone && !email) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one of full_name, phone or email is required",
        },
        { status: 400 },
      );
    }

    // ---- Duplicate guard (same phone or email) ----
    const dupOr = [];
    if (phone) dupOr.push({ phone });
    if (email) dupOr.push({ email });
    if (dupOr.length) {
      const existing = await Lead.findOne({ $or: dupOr }).lean();
      if (existing) {
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            message: "Lead already exists",
            leadId: existing.leadId,
          },
          { status: 200 },
        );
      }
    }

    // ---- Round-robin assign to a franchiseAdmin (same as Meta leads) ----
    const assignedFranchiseAdminId = await getNextFranchiseAdminId();

    // ---- Create lead ----
    const leadId =
      body.leadId?.toString() ||
      `LIMBU_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newLead = await Lead.create({
      leadId,
      formId: CRM_FORM_ID,
      fullName,
      email,
      phone,
      city,
      occupation,
      investment,
      source,
      createdTime: new Date(),
      status: "Active",
      lead_quality: "None",
      assignedFranchiseAdminId,
      verified: false,
      remarks: [],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead saved successfully",
        leadId: newLead.leadId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Franchise Lead Submit Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ==========================================================
// GET /api/franchise-leads/submit
// ----------------------------------------------------------
// Read leads back (for the chatbot / external source).
//
//  • Single lead lookup:
//      ?leadId=LIMBU_...    → one lead by leadId
//      ?phone=9876543210    → one lead by phone
//      ?email=test@x.com    → one lead by email
//
//  • List (defaults to chatbot-submitted leads):
//      ?source=chatbot&page=1&limit=20
//      ?source=all          → every source
// ==========================================================

function formatLead(l) {
  return {
    leadId: l.leadId,
    fullName: l.fullName || "",
    email: l.email || "",
    phone: l.phone || "",
    city: l.city || "",
    occupation: l.occupation || "",
    investment: l.investment || "",
    source: l.source || "",
    status: l.status || "Active",
    lead_quality: l.lead_quality || "None",
    assignedFranchiseAdminId: l.assignedFranchiseAdminId || null,
    createdTime: l.createdTime || l.createdAt || null,
  };
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const source = searchParams.get("source"); // e.g. "chatbot", "all"

    // ---- Single-lead lookup ----
    if (leadId || phone || email) {
      const query = leadId
        ? { leadId }
        : phone
          ? { phone: phone.trim() }
          : { email: email.trim() };

      const lead = await Lead.findOne(query).lean();
      if (!lead) {
        return NextResponse.json(
          { success: false, message: "Lead not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, lead: formatLead(lead) });
    }

    // ---- List ----
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // Default to chatbot leads; pass source=all for everything.
    const filter = {};
    if (source && source !== "all") {
      filter.source = source;
    } else if (!source) {
      filter.source = "chatbot";
    }

    const total = await Lead.countDocuments(filter);
    const dbLeads = await Lead.find(filter)
      .sort({ createdTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      leads: dbLeads.map(formatLead),
    });
  } catch (error) {
    console.error("Franchise Lead GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
