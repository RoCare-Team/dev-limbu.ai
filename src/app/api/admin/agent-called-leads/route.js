import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

/**
 * Day boundaries in Asia/Kolkata expressed as UTC Date values (India has no DST).
 * Kept in sync with /api/admin/call-stats so the drill-down matches the counts.
 */
function getISTDayRanges() {
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())) {
    if (type !== "literal") parts[type] = value;
  }
  const todayStart = new Date(
    `${parts.year}-${parts.month}-${parts.day}T00:00:00+05:30`,
  );
  return {
    todayStart,
    tomorrowStart: new Date(todayStart.getTime() + 86400000),
    yesterdayStart: new Date(todayStart.getTime() - 86400000),
  };
}

const MAX_LEADS = 500;

// ==================================================================
// GET: which leads were called today / yesterday, and by whom.
//   Backs the super-admin "Agent Call Activity" drill-down.
//   Query: email (required), period=today|yesterday, agentName (optional)
// ==================================================================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");
    const period = searchParams.get("period") === "yesterday" ? "yesterday" : "today";
    const agentName = (searchParams.get("agentName") || "").trim();

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email is required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("role");
    if (!admin || (admin.role !== "superAdmin" && admin.role !== "seniorManager")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { todayStart, tomorrowStart, yesterdayStart } = getISTDayRanges();
    const rangeStart = period === "yesterday" ? yesterdayStart : todayStart;
    const rangeEnd = period === "yesterday" ? todayStart : tomorrowStart;

    const normalizedAgentName = { $toLower: { $trim: { input: { $ifNull: ["$callHistory.agentName", "unknown"] } } } };

    const match = {
      "callHistory.calledAt": { $gte: rangeStart, $lt: rangeEnd },
    };

    const pipeline = [
      { $unwind: "$callHistory" },
      { $match: match },
      { $addFields: { normalizedAgentName } },
      ...(agentName
        ? [{ $match: { normalizedAgentName: agentName.toLowerCase() } }]
        : []),
      { $sort: { "callHistory.calledAt": -1 } },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          fullName: { $first: "$fullName" },
          phone: { $first: "$phone" },
          email: { $first: "$email" },
          leadStage: { $first: "$leadStage" },
          leadStatus: { $first: "$leadStatus" },
          lastCalledAt: { $first: "$callHistory.calledAt" },
          callCount: { $sum: 1 },
          calls: {
            $push: {
              agentName: {
                $trim: { input: { $ifNull: ["$callHistory.agentName", "Unknown"] } },
              },
              calledAt: "$callHistory.calledAt",
              remark: { $ifNull: ["$callHistory.remark", ""] },
            },
          },
        },
      },
      { $sort: { lastCalledAt: -1 } },
      { $limit: MAX_LEADS },
      {
        $project: {
          _id: 1,
          userId: 1,
          fullName: 1,
          phone: 1,
          email: 1,
          leadStage: 1,
          leadStatus: 1,
          lastCalledAt: 1,
          callCount: 1,
          calls: { $slice: ["$calls", 20] },
        },
      },
    ];

    const leads = await User.aggregate(pipeline);

    const totalCalls = leads.reduce((s, l) => s + (l.callCount || 0), 0);

    return NextResponse.json({
      success: true,
      period,
      agentName: agentName || null,
      rangeStart,
      rangeEnd,
      truncated: leads.length >= MAX_LEADS,
      stats: {
        totalLeads: leads.length,
        totalCalls,
      },
      leads: leads.map((l) => ({ ...l, _id: String(l._id) })),
    });
  } catch (error) {
    console.error("Agent called leads API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
