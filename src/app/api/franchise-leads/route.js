import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

// ==================
// SCHEMA
// ==================
const LeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, required: true },
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
    status: { 
      type: String, 
      default: "Active",
      enum: ["Active", "Follow Up", "Inactive", "Onboard"]
    },

    // ⭐ Assigned Admin
    assignedFranchiseAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    // ⭐ MULTIPLE REMARKS (HISTORY SAFE)
    remarks: [
      {
        text: { type: String, required: true },
        addedBy: { type: String, default: "Admin" },
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
  mongoose.models.MetaLeadFranchises || 
  mongoose.model("MetaLeadFranchises", LeadSchema);

// ==================
// SETTING MODEL (ROUND ROBIN)
// ==================
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});
const Setting = mongoose.models.settings || mongoose.model("settings", SettingSchema);

// ==================
// HELPER FUNCTION
// ==================
function extractField(fieldData, name) {
  const field = fieldData.find((f) => f.name === name);
  return field?.values?.[0] || "";
}

function formatLeadForResponse(leadDoc) {
  return {
    id: leadDoc.leadId,
    created_time: leadDoc.createdTime,
    field_data: [
      { name: "full_name", values: [leadDoc.fullName] },
      { name: "email", values: [leadDoc.email] },
      { name: "phone_number", values: [leadDoc.phone] },
      { name: "city", values: [leadDoc.city] },
      { name: "what_is_your_current_occupation?", values: [leadDoc.occupation] },
      { name: "mention_investment_rang", values: [leadDoc.investment] },
    ],
    // Flat fields for frontend
    fullName: leadDoc.fullName,
    email: leadDoc.email,
    phone: leadDoc.phone,
    city: leadDoc.city,
    occupation: leadDoc.occupation,
    investment: leadDoc.investment,
    status: leadDoc.status,
    remarks: leadDoc.remarks || [],
    assignedFranchiseAdmin: leadDoc.assignedFranchiseAdminId,
  };
}

// ==================
// GET: FETCH LEADS OR SINGLE LEAD WITH REMARKS
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const leadId = searchParams.get("leadId");
    const email = searchParams.get("email");
    
    let limit = parseInt(searchParams.get("limit") || "500", 10);
    if (isNaN(limit) || limit < 1) limit = 500;
    if (limit > 1000) limit = 1000;

    // ========== FETCH SINGLE LEAD WITH REMARKS ==========
    if (leadId) {
      const lead = await Lead.findOne({ leadId }).populate("assignedFranchiseAdminId", "fullName email role").lean();
      
      if (!lead) {
        return NextResponse.json(
          { success: false, message: "Lead not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        lead: {
          id: lead.leadId,
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          occupation: lead.occupation,
          investment: lead.investment,
          status: lead.status,
          createdTime: lead.createdTime,
          remarks: lead.remarks || [],
          assignedFranchiseAdmin: lead.assignedFranchiseAdminId,
        },
      });
    }

    // ========== FETCH ALL LEADS FROM META ==========
    if (!formId) {
      return NextResponse.json(
        { success: false, message: "formId is required" },
        { status: 400 }
      );
    }

    const META_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!META_TOKEN) {
      return NextResponse.json(
        { success: false, message: "META_ACCESS_TOKEN not configured" },
        { status: 500 }
      );
    }

    // 🔍 CHECK ADMIN ROLE FOR FILTERING
    let filterAdminId = null;
    if (email) {
      const admin = await Admin.findOne({ email });
      if (admin && admin.role === "franchiseAdmin") {
        filterAdminId = admin._id.toString();
      }
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${formId}/leads?limit=${limit}&access_token=${META_TOKEN}`
    );

    if (!metaRes.ok) {
      throw new Error(`Meta API error: ${metaRes.status}`);
    }

    const metaData = await metaRes.json();

    if (!metaData.data || metaData.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "No leads found from Meta" },
        { status: 404 }
      );
    }

    const metaLeads = metaData.data;
    const metaLeadIds = metaLeads.map((l) => l.id);

    // 🚀 OPTIMIZATION: Fetch all existing leads in ONE query
    const existingLeadsDocs = await Lead.find({
      leadId: { $in: metaLeadIds },
    }).populate("assignedFranchiseAdminId", "fullName email role").lean();

    const existingLeadsMap = new Map();
    existingLeadsDocs.forEach((doc) => existingLeadsMap.set(doc.leadId, doc));

    // 🔄 ROUND ROBIN SETUP
    const franchiseAdmins = await Admin.find({ role: "franchiseAdmin", isActive: true }).sort({ createdAt: 1 });
    let rr = await Setting.findOne({ key: "franchiseLeadRRIndex" });
    let rrIndex = rr?.value || 0;

    const newLeadsToInsert = [];
    const allLeadsResponse = [];

    for (const lead of metaLeads) {
      if (existingLeadsMap.has(lead.id)) {
        const existingDoc = existingLeadsMap.get(lead.id);
        
        // 🔍 FILTER: If franchiseAdmin, only show assigned leads
        if (filterAdminId) {
          const assigned = existingDoc.assignedFranchiseAdminId;
          const assignedId = assigned?._id ? assigned._id.toString() : assigned?.toString();
          if (assignedId !== filterAdminId) continue;
        }
        allLeadsResponse.push(formatLeadForResponse(existingDoc));
      } else {
        const normalizedLead = {
          leadId: lead.id,
          formId: formId,
          fullName: extractField(lead.field_data, "full_name"),
          email: extractField(lead.field_data, "email"),
          phone: extractField(lead.field_data, "phone_number"),
          city: extractField(lead.field_data, "city"),
          occupation: extractField(lead.field_data, "what_is_your_current_occupation?"),
          startTime: extractField(lead.field_data, "when_do_you_want_to_start?"),
          investment: extractField(lead.field_data, "mention_investment_rang"),
          verified: extractField(lead.field_data, "phone_number_verified") === "true",
          createdTime: new Date(lead.created_time),
          source: "meta",
          status: "Active",
          remarks: [],
        };

        // 🔄 ASSIGN ADMIN
        let assignedAdminObj = null;
        if (franchiseAdmins.length > 0) {
          const assignedAdmin = franchiseAdmins[rrIndex % franchiseAdmins.length];
          normalizedLead.assignedFranchiseAdminId = assignedAdmin._id;
          assignedAdminObj = assignedAdmin;
          rrIndex++;
        }

        newLeadsToInsert.push(normalizedLead);
        
        // Prepare for response (with populated admin)
        const leadForResponse = { ...normalizedLead, assignedFranchiseAdminId: assignedAdminObj };
        allLeadsResponse.push(formatLeadForResponse(leadForResponse));
      }
    }

    if (newLeadsToInsert.length > 0) {
      await Lead.insertMany(newLeadsToInsert, { ordered: false });
      // Update Round Robin Index
      await Setting.findOneAndUpdate(
        { key: "franchiseLeadRRIndex" },
        { value: rrIndex },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Leads synced successfully",
      summary: {
        total_count: allLeadsResponse.length
      },
      leads: allLeadsResponse,
      newLeadsSaved: newLeadsToInsert.length,
    });
  } catch (error) {
    console.error("Meta Lead Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
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

    const body = await req.json();
    const { leadId, text, addedBy } = body;

    if (!leadId || !text) {
      return NextResponse.json(
        { success: false, message: "leadId and text are required" },
        { status: 400 }
      );
    }

    const updatedLead = await Lead.findOneAndUpdate(
      { leadId },
      {
        $push: {
          remarks: {
            text: text.trim(),
            addedBy: addedBy || "Admin",
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    ).lean();

    if (!updatedLead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Remark added successfully",
      remarks: updatedLead.remarks,
    });
  } catch (error) {
    console.error("Add Remark Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// ==================
// PATCH: UPDATE LEAD STATUS
// ==================
export async function PATCH(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { leadId, status, assignedFranchiseAdminId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, message: "leadId is required" },
        { status: 400 }
      );
    }

    const updateFields = {};

    if (status) {
      const validStatuses = ["Active", "Follow Up", "Inactive", "Onboard"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value" },
          { status: 400 }
        );
      }
      updateFields.status = status;
    }

    if (assignedFranchiseAdminId !== undefined) {
      updateFields.assignedFranchiseAdminId = assignedFranchiseAdminId;
    }

    const updatedLead = await Lead.findOneAndUpdate(
      { leadId },
      updateFields,
      { new: true }
    ).populate("assignedFranchiseAdminId", "fullName email role").lean();

    if (!updatedLead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      lead: formatLeadForResponse(updatedLead)
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// ==================
// DELETE: DELETE A REMARK
// ==================
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const remarkIndex = searchParams.get("remarkIndex");

    if (!leadId || remarkIndex === null) {
      return NextResponse.json(
        { success: false, message: "leadId and remarkIndex are required" },
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

    if (remarkIndex < 0 || remarkIndex >= lead.remarks.length) {
      return NextResponse.json(
        { success: false, message: "Invalid remark index" },
        { status: 400 }
      );
    }

    lead.remarks.splice(remarkIndex, 1);
    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Remark deleted successfully",
      remarks: lead.remarks,
    });
  } catch (error) {
    console.error("Delete Remark Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}