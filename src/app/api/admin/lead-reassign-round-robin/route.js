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
 * Har move hui lead par "pehle kiski thi" ka tag lag jaata hai
 * (previousAgentName / previousAgentId / agentTransferredAt), jo leads table
 * me agent ke neeche "Prev: <naam>" ke roop me dikhta hai.
 *
 * Onboard ho chuke clients by default chhod diye jaate hain.
 *
 * Body:
 *   {
 *     fromEmails: string[],     // source agents whose leads get moved
 *     toEmails:   string[],     // target agents, round-robin pool (order matters)
 *     excludeStages?: string[], // default ["Onboard"] — ye stage wale leads nahi hilte
 *     mode?: "roundRobin" | "balance",
 *                               // roundRobin (default) = moved leads barabar baantna
 *                               // balance = transfer ke baad har target ka TOTAL barabar
 *     dryRun?:    boolean       // default true — preview counts, write nothing
 *   }
 *
 * Defaults (matches the requested operation) are used if the body omits them.
 */

const DEFAULT_FROM_EMAILS = [
  "imran@limbu.ai",
  "jahansingh2526@gmail.com",
];

const DEFAULT_TO_EMAILS = [
  "aryashika@limbu.ai",
  "beautycareservices@mannubhai.com",
];

// Onboard ho chuke clients transfer nahi hote.
const DEFAULT_EXCLUDE_STAGES = ["Onboard"];

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

    // Onboard (ya caller ke diye hue stages) wale leads ko haath nahi lagana.
    const excludeStages = Array.isArray(body.excludeStages)
      ? body.excludeStages.filter((s) => typeof s === "string" && s.trim())
      : DEFAULT_EXCLUDE_STAGES;

    // balance = transfer ke baad har target agent ka total barabar ho jaye
    const mode = body.mode === "balance" ? "balance" : "roundRobin";

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
    const leadQuery = { assignedAgentId: { $in: fromIds } };
    if (excludeStages.length) {
      leadQuery.leadStage = { $nin: excludeStages };
    }

    const leads = await User.find(leadQuery)
      .select("_id assignedAgentId leadStage")
      .sort({ _id: 1 })
      .lean();

    // Kitne leads exclude hue (sirf reporting ke liye)
    const skippedByStage = excludeStages.length
      ? await User.countDocuments({
          assignedAgentId: { $in: fromIds },
          leadStage: { $in: excludeStages },
        })
      : 0;

    // ---- Round-robin the leads across the target agents ----
    // buckets[targetIdString] = [userId, ...]
    // pairBuckets["targetId|sourceId"] = [userId, ...]  → "prev agent" tag ke liye
    const buckets = new Map(targetIdStrings.map((t) => [t, []]));
    const pairBuckets = new Map();

    // Kis target ko kitne leads dene hain — mode ke hisaab se.
    let quotaByTarget;

    if (mode === "balance") {
      // Har target ka CURRENT load. Jo leads abhi move ho rahi hain wo minus
      // kar dete hain — warna target khud source bhi ho to double count hoga.
      const movingCountByAgent = new Map();
      leads.forEach((l) => {
        const k = l.assignedAgentId?.toString();
        if (k) movingCountByAgent.set(k, (movingCountByAgent.get(k) || 0) + 1);
      });

      const currentLoads = await Promise.all(
        targetIds.map(async (id) => {
          const total = await User.countDocuments({ assignedAgentId: id });
          return Math.max(0, total - (movingCountByAgent.get(id.toString()) || 0));
        }),
      );

      const grandTotal =
        currentLoads.reduce((a, b) => a + b, 0) + leads.length;
      const perAgent = Math.floor(grandTotal / targetIds.length);

      // Pehle sabko us level tak bharo, phir bacha hua barabar baant do.
      quotaByTarget = currentLoads.map((load) => Math.max(0, perAgent - load));

      let assigned = quotaByTarget.reduce((a, b) => a + b, 0);
      let leftover = leads.length - assigned;

      // leftover +ve → round-robin extra baanto; -ve → peeche se kaato.
      let i = 0;
      while (leftover > 0) {
        quotaByTarget[i % quotaByTarget.length] += 1;
        leftover -= 1;
        i += 1;
      }
      while (leftover < 0) {
        const idx = i % quotaByTarget.length;
        if (quotaByTarget[idx] > 0) {
          quotaByTarget[idx] -= 1;
          leftover += 1;
        }
        i += 1;
      }
    }

    leads.forEach((lead, i) => {
      let targetKey;

      if (mode === "balance") {
        // Quota ke hisaab se sequential fill
        let idx = 0;
        let seen = 0;
        for (let t = 0; t < quotaByTarget.length; t += 1) {
          if (i < seen + quotaByTarget[t]) {
            idx = t;
            break;
          }
          seen += quotaByTarget[t];
          idx = t;
        }
        targetKey = targetIdStrings[idx];
      } else {
        targetKey = targetIdStrings[i % targetIdStrings.length];
      }

      buckets.get(targetKey).push(lead._id);

      const sourceKey = lead.assignedAgentId?.toString() || "";
      const pairKey = `${targetKey}|${sourceKey}`;
      if (!pairBuckets.has(pairKey)) pairBuckets.set(pairKey, []);
      pairBuckets.get(pairKey).push(lead._id);
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
      mode,
      excludeStages,
      totalLeadsToReassign: leads.length,
      skippedByStage,
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

    // ---- Apply: one updateMany per (target, source) pair ----
    // Pair-wise isliye ki har lead par uske PURANE agent ka naam tag ho sake.
    const fromById = new Map(fromAdmins.map((a) => [a._id.toString(), a]));
    const transferredAt = new Date();

    let modifiedCount = 0;
    for (const [pairKey, ids] of pairBuckets.entries()) {
      if (!ids.length) continue;

      const [targetKey, sourceKey] = pairKey.split("|");
      const sourceAdmin = fromById.get(sourceKey);

      const res = await User.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            assignedAgentId: targetIds.find(
              (id) => id.toString() === targetKey,
            ),
            previousAgentId: sourceAdmin?._id || null,
            previousAgentName:
              sourceAdmin?.fullName || sourceAdmin?.email || null,
            agentTransferredAt: transferredAt,
          },
        },
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
