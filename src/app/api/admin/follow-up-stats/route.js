import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";
import mongoose from "mongoose";

/** Only these latest remarks count as an active scheduled follow-up */
const FU_TEXT_OR = [
  { "latest.text": { $regex: "^Call Not Picked", $options: "i" } },
  { "latest.text": { $regex: "^Call Back Later", $options: "i" } },
];

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
    if (!admin || !["superAdmin", "admin", "agent"].includes(admin.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const isAgent = admin.role === "agent";

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
      case "custom":
      default:
        leadsDateFilter = { $exists: true, $ne: null };
    }

    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let totalDateMatch = {};
    if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
       const startDate = new Date(startDateParam);
       startDate.setHours(0, 0, 0, 0);
       const endDate = new Date(endDateParam);
       endDate.setHours(23, 59, 59, 999);
       
       if(filter === "all" || filter === "custom"){
          leadsDateFilter = { $gte: startDate, $lte: endDate };
       }
       // Filter total by the scheduled date rather than creation date
       totalDateMatch = { "latest.followUpDate": { $gte: startDate, $lte: endDate } };
    }

    const escapedName = admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const latestAgentMatch = isAgent
      ? {
          $match: {
            $or: [
              { "latest.agentId": new mongoose.Types.ObjectId(admin._id) },
              ...(escapedName
                ? [
                    {
                      "latest.agentName": {
                        $regex: new RegExp(`^${escapedName}$`, "i"),
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : null;

    /**
     * One row per user: chronologically latest remarksHistory entry only.
     * Follow-up lists only if that latest remark is CN/CBL and has followUpDate.
     * Any newer remark (e.g. Interested) removes user from follow-ups.
     */
    const latestRemarkBase = [
      { $match: { remarksHistory: { $exists: true, $ne: [], $type: "array" } } },
      { $unwind: "$remarksHistory" },
      {
        $sort: {
          userId: 1,
          "remarksHistory.createdAt": -1,
          "remarksHistory.calledAt": -1,
        },
      },
      {
        $group: {
          _id: "$userId",
          fullName: { $first: "$fullName" },
          phone: { $first: "$phone" },
          leadStatus: { $first: "$leadStatus" },
          leadStage: { $first: "$leadStage" },
          latest: { $first: "$remarksHistory" },
        },
      },
      {
        $match: {
          "latest.followUpDate": { $exists: true, $ne: null },
          $or: FU_TEXT_OR,
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
          userId: "$_id",
          fullName: 1,
          phone: 1,
          leadStatus: 1,
          leadStage: 1,
          remark: "$latest.text",
          followUpDate: "$latest.followUpDate",
          agentName: "$latest.agentName",
          agentId: "$latest.agentId",
          remarkDate: "$latest.createdAt",
        },
      },
    ];

    const countPipeline = [
      ...latestRemarkBase,
      ...(Object.keys(totalDateMatch).length > 0 ? [{ $match: totalDateMatch }] : []),
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
      User.aggregate(leadsPipeline),
      User.aggregate(countPipeline),
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
    console.error("Follow-up Stats API Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
