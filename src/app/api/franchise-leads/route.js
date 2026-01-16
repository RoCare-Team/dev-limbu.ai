import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

// ==================
// SCHEMA (SAME FILE)
// ==================
const LeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true },
    formId: String,
    fullName: String,
    email: String,
    phone: String,
    city: String,
    occupation: String,
    startTime: String,
    investment: String,
    verified: Boolean,
    createdTime: Date,
    source: { type: String, default: "meta" },

    // ⭐ MULTIPLE REMARKS (HISTORY SAFE)
    remarks: [
      {
        text: String,
        addedBy: String,   // admin / franchise name
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Lead =
  mongoose.models.MetaLead || mongoose.model("MetaLeadFranchises", LeadSchema);

// ==================
// HELPER FUNCTION
// ==================
function extractField(fieldData, name) {
  const field = fieldData.find((f) => f.name === name);
  return field?.values?.[0] || "";
}

// ==================
// GET: FETCH + SAVE META LEADS
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, message: "formId is required" },
        { status: 400 }
      );
    }

    const META_TOKEN = process.env.META_ACCESS_TOKEN;

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${META_TOKEN}`
    );

    const metaData = await metaRes.json();

    if (!metaData.data) {
      return NextResponse.json(
        { success: false, message: "No leads found" },
        { status: 404 }
      );
    }

    let savedLeads = [];

    for (const lead of metaData.data) {
      const normalizedLead = {
        leadId: lead.id,
        formId: formId,
        fullName: extractField(lead.field_data, "full_name"),
        email: extractField(lead.field_data, "email"),
        phone: extractField(lead.field_data, "phone_number"),
        city: extractField(lead.field_data, "city"),
        occupation: extractField(
          lead.field_data,
          "what_is_your_current_occupation?"
        ),
        startTime: extractField(
          lead.field_data,
          "when_do_you_want_to_start?"
        ),
        investment: extractField(
          lead.field_data,
          "mention_investment_rang"
        ),
        verified:
          extractField(lead.field_data, "phone_number_verified") === "true",
        createdTime: new Date(lead.created_time),
      };

      const exists = await Lead.findOne({ leadId: lead.id });

      if (!exists) {
        const saved = await Lead.create(normalizedLead);
        savedLeads.push(saved);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Leads synced successfully",
      totalFetched: metaData.data.length,
      newLeadsSaved: savedLeads.length,
      leads: savedLeads,
    });
  } catch (error) {
    console.error("Meta Lead Sync Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ==================
// POST: ADD NEW REMARK
// ==================
export async function POST(req) {
  try {
    await dbConnect();

    const { leadId, text, addedBy } = await req.json();

    if (!leadId || !text) {
      return NextResponse.json(
        { success: false, message: "leadId and text are required" },
        { status: 400 }
      );
    }

    const lead = await Lead.findOne({ leadId });

    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    // 🔁 PUSH NEW REMARK (OLD REMARKS SAFE)
    lead.remarks.push({
      text,
      addedBy: addedBy || "Admin",
      addedAt: new Date(),
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Remark added successfully",
      remarks: lead.remarks,
    });
  } catch (error) {
    console.error("Add Remark Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
