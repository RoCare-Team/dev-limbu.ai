import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import Lead from "@/models/MetaLeadFranchises";

/** Day boundaries in Asia/Kolkata as UTC Date values (India has no DST). */
function getISTCalendarRanges() {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)) {
    if (type !== "literal") parts[type] = value;
  }
  const y = parts.year;
  const mo = parts.month;
  const da = parts.day;

  const ist = (yy, mm, dd, hh = 0, mi = 0) =>
    new Date(
      `${yy}-${mm}-${dd}T${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+05:30`,
    );

  const todayStart = ist(y, mo, da, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 86400000);
  const next7DaysEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const yNum = parseInt(y, 10);
  const mNum = parseInt(mo, 10);
  let nextM = mNum + 1;
  let nextY = yNum;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  const thisMonthStart = ist(y, mo, "01", 0, 0);
  const thisMonthEnd = ist(
    String(nextY),
    String(nextM).padStart(2, "0"),
    "01",
    0,
    0,
  );

  return {
    todayStart,
    tomorrowStart,
    tomorrowEnd,
    next7DaysEnd,
    thisMonthStart,
    thisMonthEnd,
  };
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");
    const filter = searchParams.get("filter") || "all";

    if (!adminEmail) {
      return NextResponse.json({ success: false, error: "Admin email required" }, { status: 400 });
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role _id");
    if (
      !admin ||
      !["superAdmin", "seniorManager", "superFranchiseAdmin", "franchiseAdmin"].includes(admin.role)
    ) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const isScopedFranchiseAdmin = admin.role === "franchiseAdmin";

    const {
      todayStart,
      tomorrowStart,
      tomorrowEnd,
      next7DaysEnd,
      thisMonthStart,
      thisMonthEnd,
    } = getISTCalendarRanges();

    const escaped = admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const idStr = admin._id.toString();

    const latestAgentMatch = isScopedFranchiseAdmin
      ? {
          $match: {
            $or: [
              { assignedFranchiseAdminId: admin._id },
              { "latest.agentId": admin._id },
              { "latest.agentId": idStr },
              ...(escaped
                ? [
                    {
                      "latest.agentName": {
                        $regex: `^${escaped}$`,
                        $options: "i",
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : null;

    let leadsDateFilter;
    switch (filter) {
      case "today":
        leadsDateFilter = { $gte: todayStart, $lt: tomorrowStart };
        break;
      case "tomorrow":
        leadsDateFilter = { $gte: tomorrowStart, $lt: tomorrowEnd };
        break;
      case "next7days":
        leadsDateFilter = { $gte: todayStart, $lt: next7DaysEnd };
        break;
      case "thisMonth":
        leadsDateFilter = { $gte: thisMonthStart, $lt: thisMonthEnd };
        break;
      default:
        leadsDateFilter = { $exists: true, $ne: null };
    }

    const latestRemarkBase = [
      { $match: { remarks: { $exists: true, $ne: [], $type: "array" } } },
      { $unwind: "$remarks" },
      { $sort: { leadId: 1, "remarks.addedAt": -1 } },
      {
        $group: {
          _id: "$leadId",
          fullName: { $first: "$fullName" },
          phone: { $first: "$phone" },
          assignedFranchiseAdminId: { $first: "$assignedFranchiseAdminId" },
          latest: { $first: "$remarks" },
        },
      },
      {
        // Any remark type (Call Not Picked, Call Back Later, Interested, a custom
        // typed remark, etc.) counts as a follow-up as long as a date was set on it
        // — this was previously hard-restricted to just two remark texts, which
        // silently dropped every other remark type from the follow-up list.
        $match: {
          "latest.followUpDate": { $exists: true, $ne: null },
        },
      },
    ];

    if (latestAgentMatch) latestRemarkBase.push(latestAgentMatch);

    const leadsPipeline = [
      ...latestRemarkBase,
      { $match: { "latest.followUpDate": leadsDateFilter } },
      { $sort: { "latest.followUpDate": 1 } },
      {
        $project: {
          _id: 0,
          leadId: "$_id",
          fullName: 1,
          phone: 1,
          remark: "$latest.text",
          followUpDate: "$latest.followUpDate",
          agentName: "$latest.agentName",
          agentId: "$latest.agentId",
        },
      },
    ];

    const countPipeline = [
      ...latestRemarkBase,
      {
        $group: {
          _id: "$latest.agentId",
          agentName: { $first: "$latest.agentName" },
          total: { $sum: 1 },
          today: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$latest.followUpDate", todayStart] },
                    { $lt: ["$latest.followUpDate", tomorrowStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          tomorrow: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$latest.followUpDate", tomorrowStart] },
                    { $lt: ["$latest.followUpDate", tomorrowEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          next7days: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$latest.followUpDate", todayStart] },
                    { $lt: ["$latest.followUpDate", next7DaysEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          thisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$latest.followUpDate", thisMonthStart] },
                    { $lt: ["$latest.followUpDate", thisMonthEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ];

    const [leadsResult, byAgentResult] = await Promise.all([
      Lead.aggregate(leadsPipeline),
      Lead.aggregate(countPipeline),
    ]);

    const totalFollowUps = byAgentResult.reduce((s, a) => s + (a.total || 0), 0);
    const todayFollowUps = byAgentResult.reduce((s, a) => s + (a.today || 0), 0);
    const tomorrowFollowUps = byAgentResult.reduce((s, a) => s + (a.tomorrow || 0), 0);
    const next7DaysFollowUps = byAgentResult.reduce((s, a) => s + (a.next7days || 0), 0);
    const thisMonthFollowUps = byAgentResult.reduce((s, a) => s + (a.thisMonth || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalFollowUps,
        todayFollowUps,
        tomorrowFollowUps,
        next7DaysFollowUps,
        thisMonthFollowUps,
        byAgent: byAgentResult,
        leads: leadsResult,
      },
    });
  } catch (error) {
    console.error("Franchise follow-up stats error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
