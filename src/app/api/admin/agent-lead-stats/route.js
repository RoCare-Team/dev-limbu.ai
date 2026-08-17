import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import MetaLeadFranchises from "@/models/MetaLeadFranchises";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/**
 * GET /api/admin/agent-lead-stats
 * Per-admin assigned-lead counts for the RBAC dashboard — how many normal
 * leads (User.assignedAgentId) and franchise leads
 * (MetaLeadFranchises.assignedFranchiseAdminId) each admin currently holds.
 * Same Bearer-JWT auth as /api/users/list so it can be called right alongside it.
 */
export async function GET(req) {
  try {
    await dbConnect();

    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = auth.split(" ")[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const [leadRows, franchiseRows] = await Promise.all([
      User.aggregate([
        { $match: { assignedAgentId: { $ne: null } } },
        { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
      ]),
      MetaLeadFranchises.aggregate([
        { $match: { assignedFranchiseAdminId: { $ne: null } } },
        { $group: { _id: "$assignedFranchiseAdminId", count: { $sum: 1 } } },
      ]),
    ]);

    const byAgent = {};
    for (const row of leadRows) {
      const id = String(row._id);
      byAgent[id] = byAgent[id] || { leads: 0, franchiseLeads: 0 };
      byAgent[id].leads = row.count || 0;
    }
    for (const row of franchiseRows) {
      const id = String(row._id);
      byAgent[id] = byAgent[id] || { leads: 0, franchiseLeads: 0 };
      byAgent[id].franchiseLeads = row.count || 0;
    }

    const perAgent = Object.entries(byAgent).map(([id, v]) => ({
      _id: id,
      leads: v.leads,
      franchiseLeads: v.franchiseLeads,
      total: v.leads + v.franchiseLeads,
    }));

    const totals = perAgent.reduce(
      (acc, a) => {
        acc.leads += a.leads;
        acc.franchiseLeads += a.franchiseLeads;
        acc.total += a.total;
        return acc;
      },
      { leads: 0, franchiseLeads: 0, total: 0 },
    );

    return NextResponse.json({ success: true, perAgent, totals });
  } catch (error) {
    console.error("Agent lead stats error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
