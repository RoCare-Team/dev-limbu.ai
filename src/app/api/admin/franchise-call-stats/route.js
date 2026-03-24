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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isScopedFranchiseAdmin = admin.role === "franchiseAdmin";
    const escaped = admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const agentScope = isScopedFranchiseAdmin
      ? escaped
        ? {
            $or: [
              { "callHistory.agentId": new mongoose.Types.ObjectId(admin._id) },
              {
                $and: [
                  {
                    $or: [
                      { "callHistory.agentId": null },
                      { "callHistory.agentId": { $exists: false } },
                    ],
                  },
                  {
                    "callHistory.agentName": {
                      $regex: `^${escaped}$`,
                      $options: "i",
                    },
                  },
                ],
              },
            ],
          }
        : { "callHistory.agentId": new mongoose.Types.ObjectId(admin._id) }
      : {};

    if (isScopedFranchiseAdmin) {
      const [todayRes, totalRes] = await Promise.all([
        Lead.aggregate([
          { $unwind: "$callHistory" },
          {
            $match: {
              "callHistory.calledAt": { $gte: today, $lt: tomorrow },
              ...agentScope,
            },
          },
          { $count: "total" },
        ]),
        Lead.aggregate([
          { $unwind: "$callHistory" },
          { $match: agentScope },
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

    const todayPipeline = [
      { $unwind: "$callHistory" },
      { $match: { "callHistory.calledAt": { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: {
            $toLower: { $trim: { input: { $ifNull: ["$callHistory.agentName", ""] } } },
          },
          agentName: {
            $first: {
              $toLower: { $trim: { input: { $ifNull: ["$callHistory.agentName", "unknown"] } } },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, agentName: 1, count: 1 } },
      { $sort: { count: -1 } },
    ];

    const totalPipeline = [
      { $unwind: "$callHistory" },
      {
        $group: {
          _id: {
            $toLower: { $trim: { input: { $ifNull: ["$callHistory.agentName", ""] } } },
          },
          agentName: {
            $first: {
              $toLower: { $trim: { input: { $ifNull: ["$callHistory.agentName", "unknown"] } } },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, agentName: 1, count: 1 } },
      { $sort: { count: -1 } },
    ];

    const [todayCallsByAgent, totalCallsByAgent] = await Promise.all([
      Lead.aggregate(todayPipeline),
      Lead.aggregate(totalPipeline),
    ]);

    const totalCallsToday = todayCallsByAgent.reduce((s, a) => s + a.count, 0);

    return NextResponse.json({
      success: true,
      stats: { todayCallsByAgent, totalCallsByAgent, totalCallsToday },
    });
  } catch (error) {
    console.error("Franchise call stats error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
