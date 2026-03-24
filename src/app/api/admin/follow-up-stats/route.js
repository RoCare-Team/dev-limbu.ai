import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");
    const filter     = searchParams.get("filter") || "all";

    if (!adminEmail) {
      return NextResponse.json({ success: false, error: "Admin email required" }, { status: 400 });
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role _id");
    if (!admin || !["superAdmin", "admin", "agent"].includes(admin.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const isAgent = admin.role === "agent";

    /* ── Date buckets ── */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const next7DaysEnd = new Date(todayStart);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

    const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const thisMonthEnd   = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    /* ── Agent scope filter (applied to ALL pipelines) ── */
    // Match by agentId (ObjectId) — stored since last fix
    // Also allow fallback via agentName for legacy data
    const agentScope = isAgent
      ? {
          $or: [
            { "remarksHistory.agentId": new mongoose.Types.ObjectId(admin._id) },
            { "remarksHistory.agentName": { $regex: new RegExp(`^${admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          ]
        }
      : {};

    /* ── Filter → date range for leads list ── */
    let leadsDateFilter;
    switch (filter) {
      case "today":     leadsDateFilter = { $gte: todayStart,     $lt: tomorrowStart  }; break;
      case "tomorrow":  leadsDateFilter = { $gte: tomorrowStart,  $lt: tomorrowEnd    }; break;
      case "next7days": leadsDateFilter = { $gte: todayStart,     $lt: next7DaysEnd   }; break;
      case "thisMonth": leadsDateFilter = { $gte: thisMonthStart, $lt: thisMonthEnd   }; break;
      default:          leadsDateFilter = { $exists: true, $ne: null };
    }

    /* ── Leads list pipeline ── */
    const leadsPipeline = [
      { $unwind: "$remarksHistory" },
      {
        $match: {
          "remarksHistory.followUpDate": leadsDateFilter,
          ...agentScope,
        }
      },
      { $sort: { "remarksHistory.followUpDate": 1 } },
      {
        $project: {
          _id: 0,
          userId: 1,
          fullName: 1,
          phone: 1,
          leadStatus: 1,
          leadStage: 1,
          remark:      "$remarksHistory.text",
          followUpDate:"$remarksHistory.followUpDate",
          agentName:   "$remarksHistory.agentName",
          agentId:     "$remarksHistory.agentId",
          remarkDate:  "$remarksHistory.createdAt",
        }
      }
    ];

    /* ── Single-pass bucket count pipeline ── */
    // Groups every follow-up remark by agentId, counting into date buckets in one aggregation
    const countPipeline = [
      { $unwind: "$remarksHistory" },
      {
        $match: {
          "remarksHistory.followUpDate": { $exists: true, $ne: null },
          ...agentScope,
        }
      },
      {
        $group: {
          _id: "$remarksHistory.agentId",
          agentName: { $first: "$remarksHistory.agentName" },
          total:     { $sum: 1 },
          today: {
            $sum: {
              $cond: [{ $and: [
                { $gte: ["$remarksHistory.followUpDate", todayStart] },
                { $lt:  ["$remarksHistory.followUpDate", tomorrowStart] }
              ]}, 1, 0]
            }
          },
          tomorrow: {
            $sum: {
              $cond: [{ $and: [
                { $gte: ["$remarksHistory.followUpDate", tomorrowStart] },
                { $lt:  ["$remarksHistory.followUpDate", tomorrowEnd] }
              ]}, 1, 0]
            }
          },
          next7days: {
            $sum: {
              $cond: [{ $and: [
                { $gte: ["$remarksHistory.followUpDate", todayStart] },
                { $lt:  ["$remarksHistory.followUpDate", next7DaysEnd] }
              ]}, 1, 0]
            }
          },
          thisMonth: {
            $sum: {
              $cond: [{ $and: [
                { $gte: ["$remarksHistory.followUpDate", thisMonthStart] },
                { $lt:  ["$remarksHistory.followUpDate", thisMonthEnd] }
              ]}, 1, 0]
            }
          },
        }
      },
      { $sort: { total: -1 } }
    ];

    const [leadsResult, byAgentResult] = await Promise.all([
      User.aggregate(leadsPipeline),
      User.aggregate(countPipeline),
    ]);

    /* ── Roll up totals from per-agent data ── */
    const totalFollowUps    = byAgentResult.reduce((s, a) => s + (a.total    || 0), 0);
    const todayFollowUps    = byAgentResult.reduce((s, a) => s + (a.today    || 0), 0);
    const tomorrowFollowUps = byAgentResult.reduce((s, a) => s + (a.tomorrow || 0), 0);
    const next7DaysFollowUps= byAgentResult.reduce((s, a) => s + (a.next7days|| 0), 0);
    const thisMonthFollowUps= byAgentResult.reduce((s, a) => s + (a.thisMonth|| 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalFollowUps,
        todayFollowUps,
        tomorrowFollowUps,
        next7DaysFollowUps,
        thisMonthFollowUps,
        byAgent: byAgentResult,   // per-agent breakdown for super admin table
        leads:   leadsResult,
      }
    });

  } catch (error) {
    console.error("Follow-up Stats API Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
