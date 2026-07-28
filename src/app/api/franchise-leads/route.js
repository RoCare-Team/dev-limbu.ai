import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import Lead from "@/models/MetaLeadFranchises";
import { syncFranchiseLeadsIvrInterestFromCalls } from "@/lib/syncFranchiseIvrInterest";

const FOLLOW_UP_PREFIXES = ["Call Not Picked", "Call Back Later"];

// ==================
// SETTING MODEL (ROUND ROBIN)
// ==================
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});
const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

// ==================
// HELPER FUNCTION
// ==================
function extractField(fieldData, name) {
  const field = fieldData.find((f) => f.name === name);
  return field?.values?.[0] || "";
}

function isoOrNull(d) {
  if (d == null) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

function formatLeadForResponse(leadDoc) {
  return {
    id: leadDoc.leadId,
    created_time: leadDoc.createdTime,
    source: leadDoc.source,
    field_data: [
      { name: "full_name", values: [leadDoc.fullName] },
      { name: "email", values: [leadDoc.email] },
      { name: "phone_number", values: [leadDoc.phone] },
      { name: "city", values: [leadDoc.city] },
      {
        name: "what_is_your_current_occupation?",
        values: [leadDoc.occupation],
      },
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
    lead_quality: leadDoc.lead_quality || "None",
    remarks: leadDoc.remarks || [],
    assignedFranchiseAdmin: leadDoc.assignedFranchiseAdminId,
    ivrMeInterested: leadDoc.ivrMeInterested === true,
    ivrMeInterestedAt: isoOrNull(leadDoc.ivrMeInterestedAt),
  };
}

// ==================
// GET: FETCH LEADS OR SINGLE LEAD WITH REMARKS (FULLY UPDATED & PAGINATED)
// ==================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const leadId = searchParams.get("leadId");
    const email = searchParams.get("email");
    
    // Filters from client side
    const status = searchParams.get("status") || "All";
    const assigneeId = searchParams.get("assigneeId") || "All";
    const lead_quality = searchParams.get("lead_quality") || "All";
    const search = searchParams.get("search");
    const remarkFilter = searchParams.get("remarkFilter");
    const remarkCountFilter = searchParams.get("remarkCountFilter");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Pagination parameters
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (page < 1) page = 1;
    if (limit < 1) limit = 50;
    if (limit > 100) limit = 100; // Safe pagination limit

    // ========== FETCH SINGLE LEAD WITH REMARKS ==========
    if (leadId) {
      const lead = await Lead.findOne({ leadId })
        .populate("assignedFranchiseAdminId", "fullName email role")
        .lean();
      if (!lead) {
        return NextResponse.json(
          { success: false, message: "Lead not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        lead: formatLeadForResponse(lead),
      });
    }

    if (!formId) {
      return NextResponse.json(
        { success: false, message: "formId is required" },
        { status: 400 },
      );
    }

    // Support one or more comma-separated form IDs (current + legacy franchise forms)
    const formIds = String(formId)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // ==========================================
    // 1. BUILD QUERY FILTER (Base Stats Query)
    // ==========================================
    const baseStatsQuery =
      formIds.length > 1 ? { formId: { $in: formIds } } : { formId: formIds[0] };

    // Role-based security check: If restricted agent, only show assigned leads
    if (email) {
      const admin = await Admin.findOne({ email });
      if (admin && admin.role === "franchiseAdmin") {
        baseStatsQuery.assignedFranchiseAdminId = admin._id;
      } else if (assigneeId && assigneeId !== "All") {
        // If superAdmin or similar, respect the manual assignee filter selection
        if (assigneeId === "Unassigned") {
          baseStatsQuery.assignedFranchiseAdminId = null;
        } else if (mongoose.Types.ObjectId.isValid(assigneeId)) {
          baseStatsQuery.assignedFranchiseAdminId = new mongoose.Types.ObjectId(assigneeId);
        }
      }
    }

    // Lead Quality Filter
    if (lead_quality && lead_quality !== "All") {
      baseStatsQuery.lead_quality = lead_quality;
    }

    // Search Query (Text search matching fields)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      baseStatsQuery.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { city: searchRegex },
        { occupation: searchRegex },
      ];
    }

    // Date Range Filters
    if (startDate || endDate) {
      baseStatsQuery.createdTime = {};
      if (startDate) {
        baseStatsQuery.createdTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day
        baseStatsQuery.createdTime.$lte = end;
      }
    }

    // Remarks and Remark Counts Query Filters
    if (remarkFilter && remarkFilter !== "All") {
      if (remarkFilter === "Has Remarks") {
        baseStatsQuery["remarks.0"] = { $exists: true };
      } else if (remarkFilter === "No Remarks") {
        baseStatsQuery.remarks = { $size: 0 };
      } else {
        baseStatsQuery["remarks.text"] = remarkFilter;
      }
    }

    if (remarkCountFilter && remarkCountFilter !== "All") {
      if (remarkCountFilter === "1 Remark") {
        baseStatsQuery.remarks = { $size: 1 };
      } else if (remarkCountFilter === "2 Remarks") {
        baseStatsQuery.remarks = { $size: 2 };
      } else if (remarkCountFilter === "3 Remarks") {
        baseStatsQuery.remarks = { $size: 3 };
      } else if (remarkCountFilter === "More than 3 Remarks") {
        baseStatsQuery["remarks.3"] = { $exists: true }; // Checks if index 3 (4th element) exists
      }
    }

    // ==========================================
    // 2. GET STATUS AGGREGATION USING MONGOOSE FACET (High Performance)
    // ==========================================
    const facetResult = await Lead.aggregate([
      { $match: baseStatsQuery },
      {
        $facet: {
          total: [{ $count: "count" }],
          active: [
            { $match: { status: "Active" } },
            { $count: "count" }
          ],
          inactive: [
            { $match: { status: "Inactive" } },
            { $count: "count" }
          ],
          followup: [
            { $match: { status: "Follow Up" } },
            { $count: "count" }
          ],
          onboard: [
            { $match: { status: "Onboard" } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const stats = facetResult[0] || {};
    const totalCount = stats.total?.[0]?.count || 0;
    const activeCount = stats.active?.[0]?.count || 0;
    const inactiveCount = stats.inactive?.[0]?.count || 0;
    const followupCount = stats.followup?.[0]?.count || 0;
    const onboardCount = stats.onboard?.[0]?.count || 0;

    // ==========================================
    // 3. APPLY CURRENT STATUS FILTER FOR LEADS PAGINATION
    // ==========================================
    const finalLeadsQuery = { ...baseStatsQuery };
    if (status && status !== "All") {
      finalLeadsQuery.status = status;
    }

    // Counts matching exact filters with current page context (for pagination UI calculations)
    const filteredTotalCount = await Lead.countDocuments(finalLeadsQuery);

    // Fetch paginated chunk of leads
    const dbLeads = await Lead.find(finalLeadsQuery)
      .populate("assignedFranchiseAdminId", "fullName email role")
      .sort({ createdTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedLeads = dbLeads.map(formatLeadForResponse);

    return NextResponse.json({
      success: true,
      message: "Leads fetched successfully",
      summary: {
        total_count: totalCount,          // Overall total database matching filters
        active_count: activeCount,        // Unfiltered database Active count matching search
        inactive_count: inactiveCount,    // Unfiltered database Inactive count matching search
        followup_count: followupCount,    // Unfiltered database Follow Up count matching search
        onboard_count: onboardCount,      // Unfiltered database Onboard count matching search
        filtered_count: filteredTotalCount, // Total matching current active status tab
        page,
        limit,
        total_pages: Math.ceil(filteredTotalCount / limit),
      },
      leads: formattedLeads,
    });
  } catch (error) {
    console.error("Fetch Leads Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
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

    // ---------------------------------------------------------
    // CASE 1: ADD REMARK (If leadId is present)
    // ---------------------------------------------------------
    if (body.leadId) {
      const {
        leadId,
        text,
        texts,
        addedBy,
        followUpDate,
        agentId,
        agentName,
        adminEmail,
      } = body;

      // `texts` adds several remarks in one shot; `text` stays supported for
      // existing callers. Either way we end up with a list of entries to push.
      const remarkTexts = (Array.isArray(texts) ? texts : [text])
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean);

      if (remarkTexts.length === 0) {
        return NextResponse.json(
          { success: false, message: "text is required for remarks" },
          { status: 400 },
        );
      }

      let agentObjId =
        agentId && mongoose.Types.ObjectId.isValid(String(agentId))
          ? new mongoose.Types.ObjectId(String(agentId))
          : null;
      let resolvedName = (agentName && String(agentName).trim()) || "Admin";

      const emailForLookup = adminEmail || body.email;
      if (emailForLookup && !agentObjId) {
        const adm = await Admin.findOne({ email: emailForLookup })
          .select("_id fullName")
          .lean();
        if (adm) {
          agentObjId = adm._id;
          resolvedName = adm.fullName || resolvedName;
        }
      }

      let fu = followUpDate ? new Date(followUpDate) : null;
      const needsFuCarry =
        remarkTexts.some((t) => FOLLOW_UP_PREFIXES.some((p) => t.startsWith(p))) &&
        (!fu || Number.isNaN(fu.getTime()));

      if (needsFuCarry) {
        const existing = await Lead.findOne({ leadId })
          .select("remarks")
          .lean();
        const prev = [...(existing?.remarks || [])]
          .reverse()
          .find((r) => r.followUpDate);
        if (prev?.followUpDate) {
          fu = new Date(prev.followUpDate);
        } else {
          fu = new Date(Date.now() + 60 * 60 * 1000);
        }
      }

      // Stagger addedAt by a millisecond each so a batch keeps a stable order
      // when anything downstream sorts by timestamp.
      const now = Date.now();
      const remarkEntries = remarkTexts.map((t, i) => ({
        text: t,
        addedBy: addedBy || "Admin",
        addedAt: new Date(now + i),
        ...(fu && !Number.isNaN(fu.getTime()) ? { followUpDate: fu } : {}),
        ...(agentObjId
          ? { agentId: agentObjId, agentName: resolvedName }
          : { agentName: resolvedName }),
      }));

      const pushOps = { remarks: { $each: remarkEntries } };
      if (agentObjId || resolvedName) {
        // One submission is one call, even when it carries several remarks —
        // otherwise a batch would inflate the per-agent call counters.
        pushOps.callHistory = {
          agentId: agentObjId || null,
          agentName: resolvedName,
          calledAt: new Date(now),
          remark: remarkTexts.join(" | "),
        };
      }

      const updatedLead = await Lead.findOneAndUpdate(
        { leadId },
        { $push: pushOps },
        { new: true },
      ).lean();

      if (!updatedLead) {
        return NextResponse.json(
          { success: false, message: "Lead not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message:
          remarkTexts.length > 1
            ? `${remarkTexts.length} remarks added successfully`
            : "Remark added successfully",
        added: remarkTexts.length,
        remarks: updatedLead.remarks,
      });
    }

    // ---------------------------------------------------------
    // CASE 2: CREATE MANUAL LEAD (If leadId is missing)
    // ---------------------------------------------------------
    else {
      // Generate a unique lead ID for manual entry
      const leadId = `MANUAL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const newLead = new Lead({
        leadId,
        formId: "MANUAL",
        fullName: body.full_name || "",
        email: body.email || "",
        phone: body.phone_number || "",
        city: body.city || "",
        occupation: body.occupation || "",
        investment: body.investment_range || "",
        source: "manual",
        createdTime: new Date(),
        status: "Active",
        lead_quality: body.lead_quality || "None",
        verified: false,
        remarks: [],
      });

      await newLead.save();

      return NextResponse.json({
        success: true,
        message: "Lead added successfully",
        lead: formatLeadForResponse(newLead),
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
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
    const { leadId, status, assignedFranchiseAdminId, lead_quality } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, message: "leadId is required" },
        { status: 400 },
      );
    }

    const updateFields = {};

    if (status) {
      const validStatuses = ["Active", "Follow Up", "Inactive", "Onboard"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value" },
          { status: 400 },
        );
      }
      updateFields.status = status;
    }

    if (lead_quality) {
      const validQualities = ["None", "Hot", "Warm", "Cold"];
      if (!validQualities.includes(lead_quality)) {
        return NextResponse.json(
          { success: false, message: "Invalid lead quality value" },
          { status: 400 },
        );
      }
      updateFields.lead_quality = lead_quality;
    }

    if (assignedFranchiseAdminId !== undefined) {
      updateFields.assignedFranchiseAdminId = assignedFranchiseAdminId;
    }

    const updatedLead = await Lead.findOneAndUpdate({ leadId }, updateFields, {
      new: true,
    })
      .populate("assignedFranchiseAdminId", "fullName email role")
      .lean();

    if (!updatedLead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      lead: formatLeadForResponse(updatedLead),
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
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

    if (!leadId) {
      return NextResponse.json(
        { success: false, message: "leadId is required" },
        { status: 400 },
      );
    }

    // If remarkIndex is provided, delete the remark
    if (remarkIndex !== null) {
      const lead = await Lead.findOne({ leadId });

      if (!lead) {
        return NextResponse.json(
          { success: false, message: "Lead not found" },
          { status: 404 },
        );
      }

      if (remarkIndex < 0 || remarkIndex >= lead.remarks.length) {
        return NextResponse.json(
          { success: false, message: "Invalid remark index" },
          { status: 400 },
        );
      }

      lead.remarks.splice(remarkIndex, 1);
      await lead.save();

      return NextResponse.json({
        success: true,
        message: "Remark deleted successfully",
        remarks: lead.remarks,
      });
    }

    // If no remarkIndex, delete the lead itself
    const deletedLead = await Lead.findOneAndDelete({ leadId });

    if (!deletedLead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
