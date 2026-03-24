import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import Lead from "@/models/MetaLeadFranchises";

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
      !["superAdmin", "superFranchiseAdmin", "franchiseAdmin"].includes(admin.role)
    ) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const isScopedFranchiseAdmin = admin.role === "franchiseAdmin";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const next7DaysEnd = new Date(todayStart);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const thisMonthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    const escaped = admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const agentScope = isScopedFranchiseAdmin
      ? escaped
        ? {
            $or: [
              { "remarks.agentId": new mongoose.Types.ObjectId(admin._id) },
              {
                $and: [
                  {
                    $or: [
                      { "remarks.agentId": null },
                      { "remarks.agentId": { $exists: false } },
                    ],
                  },
                  {
                    "remarks.agentName": { $regex: `^${escaped}$`, $options: "i" },
                  },
                ],
              },
            ],
          }
        : { "remarks.agentId": new mongoose.Types.ObjectId(admin._id) }
      : {};

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

    const leadsPipeline = [
      { $unwind: "$remarks" },
      {
        $match: {
          "remarks.followUpDate": leadsDateFilter,
          ...agentScope,
        },
      },
      { $sort: { "remarks.followUpDate": 1 } },
      {
        $project: {
          _id: 0,
          leadId: 1,
          fullName: "$fullName",
          phone: "$phone",
          remark: "$remarks.text",
          followUpDate: "$remarks.followUpDate",
          agentName: "$remarks.agentName",
          agentId: "$remarks.agentId",
        },
      },
    ];

    const countPipeline = [
      { $unwind: "$remarks" },
      {
        $match: {
          "remarks.followUpDate": { $exists: true, $ne: null },
          ...agentScope,
        },
      },
      {
        $group: {
          _id: "$remarks.agentId",
          agentName: { $first: "$remarks.agentName" },
          total: { $sum: 1 },
          today: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$remarks.followUpDate", todayStart] },
                    { $lt: ["$remarks.followUpDate", tomorrowStart] },
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
                    { $gte: ["$remarks.followUpDate", tomorrowStart] },
                    { $lt: ["$remarks.followUpDate", tomorrowEnd] },
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
                    { $gte: ["$remarks.followUpDate", todayStart] },
                    { $lt: ["$remarks.followUpDate", next7DaysEnd] },
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
                    { $gte: ["$remarks.followUpDate", thisMonthStart] },
                    { $lt: ["$remarks.followUpDate", thisMonthEnd] },
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
