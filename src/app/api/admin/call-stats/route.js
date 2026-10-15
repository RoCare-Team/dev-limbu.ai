import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";
import mongoose from "mongoose";

/**
 * Day boundaries in Asia/Kolkata expressed as UTC Date values (India has no DST).
 * The server runs in UTC, so plain setHours(0,0,0,0) would put every call made
 * between 00:00–05:30 IST into the previous day.
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

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email is required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role _id");

    if (!admin || !["superAdmin", "seniorManager", "admin", "agent"].includes(admin.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const {
      todayStart: today,
      tomorrowStart: tomorrow,
      yesterdayStart: yesterday,
    } = getISTDayRanges();

    const isAgent = admin.role === "agent";

    // Agent scope: match by agentId (new records) OR agentName (legacy records where agentId was null)
    const nameRegex = admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const agentScope = isAgent
      ? {
          $or: [
            { "callHistory.agentId": new mongoose.Types.ObjectId(admin._id) },
            {
              "callHistory.agentId": null,
              "callHistory.agentName": { $regex: nameRegex, $options: "i" },
            },
          ],
        }
      : {};

    if (isAgent) {
      /* ── Agent view: simple counts ── */
      let totalDateMatchForAgent = {};
      const dateFilter = searchParams.get("dateFilter");
      const startDateParam = searchParams.get("startDate");
      const endDateParam = searchParams.get("endDate");
      if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
         const startDate = new Date(startDateParam);
         startDate.setHours(0, 0, 0, 0);
         const endDate = new Date(endDateParam);
         endDate.setHours(23, 59, 59, 999);
         totalDateMatchForAgent = { "callHistory.calledAt": { $gte: startDate, $lte: endDate } };
      }

      const [todayRes, totalRes] = await Promise.all([
        User.aggregate([
          { $unwind: "$callHistory" },
          { $match: { "callHistory.calledAt": { $gte: today, $lt: tomorrow }, ...agentScope } },
          { $count: "total" },
        ]),
        User.aggregate([
          { $unwind: "$callHistory" },
          { $match: { ...agentScope, ...totalDateMatchForAgent } },
          { $count: "total" },
        ]),
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          myCallsToday: todayRes[0]?.total || 0,
          myCallsTotal: totalRes[0]?.total || 0,
          todayCallsByAgent: [],
          totalCallsByAgent: [],
          totalCallsToday: todayRes[0]?.total || 0,
        },
      });
    }

    /* ── Admin / SuperAdmin view: breakdown per agent ── */
    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let totalDateMatch = {};
    if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
       const startDate = new Date(startDateParam);
       startDate.setHours(0, 0, 0, 0);
       const endDate = new Date(endDateParam);
       endDate.setHours(23, 59, 59, 999);
       totalDateMatch = { "callHistory.calledAt": { $gte: startDate, $lte: endDate } };
    }

    /* Today + yesterday per agent in a single pass over the last two IST days. */
    const dayWisePipeline = [
      { $unwind: "$callHistory" },
      { $match: { "callHistory.calledAt": { $gte: yesterday, $lt: tomorrow } } },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: { $ifNull: ["$callHistory.agentName", "unknown"] } },
            },
          },
          displayName: {
            $first: {
              $trim: { input: { $ifNull: ["$callHistory.agentName", "Unknown"] } },
            },
          },
          today: {
            $sum: {
              $cond: [{ $gte: ["$callHistory.calledAt", today] }, 1, 0],
            },
          },
          yesterday: {
            $sum: {
              $cond: [{ $lt: ["$callHistory.calledAt", today] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          agentName: "$_id",
          displayName: 1,
          today: 1,
          yesterday: 1,
        },
      },
      { $sort: { today: -1, yesterday: -1, agentName: 1 } },
    ];

    const totalPipeline = [
      { $unwind: "$callHistory" },
      ...(Object.keys(totalDateMatch).length > 0 ? [{ $match: totalDateMatch }] : []),
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$callHistory.agentName" } } },
          agentName: { $first: { $toLower: { $trim: { input: "$callHistory.agentName" } } } },
          count: { $sum: 1 },
        }
      },
      { $project: { _id: 0, agentName: 1, count: 1 } },
      { $sort: { count: -1 } },
    ];

    const [callsByAgentDayWise, totalCallsByAgent] = await Promise.all([
      User.aggregate(dayWisePipeline),
      User.aggregate(totalPipeline),
    ]);

    // Backward-compatible shapes for the existing dashboards
    const todayCallsByAgent = callsByAgentDayWise
      .filter((a) => a.today > 0)
      .map((a) => ({ agentName: a.agentName, count: a.today }))
      .sort((a, b) => b.count - a.count);

    const yesterdayCallsByAgent = callsByAgentDayWise
      .filter((a) => a.yesterday > 0)
      .map((a) => ({ agentName: a.agentName, count: a.yesterday }))
      .sort((a, b) => b.count - a.count);

    const totalCallsToday = todayCallsByAgent.reduce((s, a) => s + a.count, 0);
    const totalCallsYesterday = yesterdayCallsByAgent.reduce(
      (s, a) => s + a.count,
      0,
    );

    return NextResponse.json({
      success: true,
      stats: {
        todayCallsByAgent,
        yesterdayCallsByAgent,
        totalCallsByAgent,
        totalCallsToday,
        totalCallsYesterday,
        // Per-agent today vs yesterday (super-admin call activity panel)
        callsByAgentDayWise,
      },
    });

  } catch (error) {
    console.error("Call Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
