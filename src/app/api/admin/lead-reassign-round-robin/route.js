import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

/**
 * One-time bulk reassignment with round-robin distribution.
 *
 * Takes every product lead (`User.assignedAgentId`) currently owned by the
 * "from" agents and redistributes them evenly, round-robin, across the "to"
 * agents. Agents are resolved by email so this is safe to trigger by hand.
 *
 * Body:
 *   {
 *     fromEmails: string[],   // source agents whose leads get moved
 *     toEmails:   string[],   // target agents, round-robin pool (order matters)
 *     dryRun?:    boolean     // default true — preview counts, write nothing
 *   }
 *
 * Defaults (matches the requested operation) are used if the body omits them.
 */

const DEFAULT_FROM_EMAILS = [
  "22junewhatsappapi@gmail.com",
  "rs959712@gmail.com",
  "vishal@limbu.ai",
];

const DEFAULT_TO_EMAILS = [
  "jahansingh2526@gmail.com",
  "imran@limbu.ai",
  "beautycareservices@mannubhai.com",
];

function normalizeEmails(list) {
  if (!Array.isArray(list)) return [];
  return [
    ...new Set(
      list
        .filter((e) => typeof e === "string")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export async function POST(req) {
  try {
    await dbConnect();

    let body = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine — fall back to defaults
    }

    const fromEmails = normalizeEmails(body.fromEmails)?.length
      ? normalizeEmails(body.fromEmails)
      : DEFAULT_FROM_EMAILS;
    const toEmails = normalizeEmails(body.toEmails)?.length
      ? normalizeEmails(body.toEmails)
      : DEFAULT_TO_EMAILS;

    // Safety default: preview unless the caller explicitly sets dryRun:false.
    const dryRun = body.dryRun !== false;

    // ---- Resolve source agents by email ----
    const fromAdmins = await Admin.find({ email: { $in: fromEmails } })
      .select("_id email fullName role isActive")
      .lean();
    const foundFromEmails = new Set(fromAdmins.map((a) => a.email));
    const missingFrom = fromEmails.filter((e) => !foundFromEmails.has(e));

    // ---- Resolve target agents by email, preserving the requested order ----
    const toAdminsByEmail = new Map();
    const toAdminsRaw = await Admin.find({ email: { $in: toEmails } })
      .select("_id email fullName role isActive")
      .lean();
    toAdminsRaw.forEach((a) => toAdminsByEmail.set(a.email, a));
    const toAdmins = toEmails
      .map((e) => toAdminsByEmail.get(e))
      .filter(Boolean);
    const missingTo = toEmails.filter((e) => !toAdminsByEmail.has(e));

    if (!toAdmins.length) {
      return NextResponse.json(
        {
          success: false,
          error: "None of the target agents were found by email.",
          missingTo,
        },
        { status: 404 },
      );
    }
    if (!fromAdmins.length) {
      return NextResponse.json(
        {
          success: false,
          error: "None of the source agents were found by email.",
          missingFrom,
        },
        { status: 404 },
      );
    }

    const fromIds = fromAdmins.map((a) => a._id);
    const targetIds = toAdmins.map((a) => a._id);
    const targetIdStrings = targetIds.map((id) => id.toString());

    // ---- Collect the leads to move (deterministic order for a fair split) ----
    const leads = await User.find({ assignedAgentId: { $in: fromIds } })
      .select("_id assignedAgentId")
      .sort({ _id: 1 })
      .lean();

    // ---- Round-robin the leads across the target agents ----
    // buckets[targetIdString] = [userId, ...]
    const buckets = new Map(targetIdStrings.map((t) => [t, []]));
    leads.forEach((lead, i) => {
      const targetKey = targetIdStrings[i % targetIdStrings.length];
      buckets.get(targetKey).push(lead._id);
    });

    const perTarget = toAdmins.map((a) => ({
      email: a.email,
      fullName: a.fullName,
      role: a.role,
      agentId: a._id.toString(),
      leadsAssigned: buckets.get(a._id.toString()).length,
    }));

    // Per-source breakdown of what will be moved
    const perSourceCounts = {};
    leads.forEach((lead) => {
      const key = lead.assignedAgentId?.toString();
      if (key) perSourceCounts[key] = (perSourceCounts[key] || 0) + 1;
    });
    const perSource = fromAdmins.map((a) => ({
      email: a.email,
      fullName: a.fullName,
      role: a.role,
      agentId: a._id.toString(),
      leadsOwned: perSourceCounts[a._id.toString()] || 0,
    }));

    const summary = {
      dryRun,
      totalLeadsToReassign: leads.length,
      from: perSource,
      to: perTarget,
      missingFrom,
      missingTo,
    };

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message:
          "DRY RUN — nothing was written. Review the counts, then POST again with { \"dryRun\": false } to apply.",
        ...summary,
      });
    }

    // ---- Apply: one updateMany per target bucket ----
    let modifiedCount = 0;
    for (const target of toAdmins) {
      const ids = buckets.get(target._id.toString());
      if (!ids.length) continue;
      const res = await User.updateMany(
        { _id: { $in: ids } },
        { $set: { assignedAgentId: target._id } },
      );
      modifiedCount += res.modifiedCount || 0;
    }

    return NextResponse.json({
      success: true,
      message: "Leads reassigned round-robin successfully.",
      ...summary,
      modifiedCount,
    });
  } catch (error) {
    console.error("lead-reassign-round-robin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
