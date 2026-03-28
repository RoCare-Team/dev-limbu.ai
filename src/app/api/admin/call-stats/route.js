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

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email is required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role _id");

    if (!admin || !["superAdmin", "admin", "agent"].includes(admin.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
      const [todayRes, totalRes] = await Promise.all([
        User.aggregate([
          { $unwind: "$callHistory" },
          { $match: { "callHistory.calledAt": { $gte: today, $lt: tomorrow }, ...agentScope } },
          { $count: "total" },
        ]),
        User.aggregate([
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

    /* ── Admin / SuperAdmin view: breakdown per agent ── */
    const todayPipeline = [
      { $unwind: "$callHistory" },
      { $match: { "callHistory.calledAt": { $gte: today, $lt: tomorrow } } },
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

    const totalPipeline = [
      { $unwind: "$callHistory" },
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

    const [todayCallsByAgent, totalCallsByAgent] = await Promise.all([
      User.aggregate(todayPipeline),
      User.aggregate(totalPipeline),
    ]);

    const totalCallsToday = todayCallsByAgent.reduce((s, a) => s + a.count, 0);

    return NextResponse.json({
      success: true,
      stats: { todayCallsByAgent, totalCallsByAgent, totalCallsToday },
    });

  } catch (error) {
    console.error("Call Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
