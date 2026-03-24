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
    // Match by agentId (ObjectId) for precision — name can have typos/case issues
    const agentIdFilter = isAgent
      ? { "callHistory.agentId": new mongoose.Types.ObjectId(admin._id) }
      : {};

    /* ── Today's calls ── */
    const todayPipeline = [
      { $unwind: "$callHistory" },
      {
        $match: {
          "callHistory.calledAt": { $gte: today, $lt: tomorrow },
          ...agentIdFilter,
        }
      },
      {
        $group: {
          _id: isAgent
            ? "$callHistory.agentId"
            : { $toLower: { $trim: { input: "$callHistory.agentName" } } },
          agentName: { $first: { $toLower: { $trim: { input: "$callHistory.agentName" } } } },
          count: { $sum: 1 },
        }
      },
      { $project: { _id: 0, agentName: 1, count: 1 } },
      { $sort: { count: -1 } }
    ];

    /* ── Total calls ── */
    const totalPipeline = [
      { $unwind: "$callHistory" },
      ...(isAgent ? [{ $match: agentIdFilter }] : []),
      {
        $group: {
          _id: isAgent
            ? "$callHistory.agentId"
            : { $toLower: { $trim: { input: "$callHistory.agentName" } } },
          agentName: { $first: { $toLower: { $trim: { input: "$callHistory.agentName" } } } },
          count: { $sum: 1 },
        }
      },
      { $project: { _id: 0, agentName: 1, count: 1 } },
      { $sort: { count: -1 } }
    ];

    const [todayCallsByAgent, totalCallsByAgent] = await Promise.all([
      User.aggregate(todayPipeline),
      User.aggregate(totalPipeline),
    ]);

    const myCallsToday = isAgent ? (todayCallsByAgent[0]?.count || 0) : null;
    const myCallsTotal = isAgent ? (totalCallsByAgent[0]?.count || 0) : null;
    const totalCallsToday = todayCallsByAgent.reduce((s, a) => s + a.count, 0);

    return NextResponse.json({
      success: true,
      stats: {
        todayCallsByAgent,
        totalCallsByAgent,
        totalCallsToday,
        ...(isAgent && { myCallsToday, myCallsTotal }),
      }
    });

  } catch (error) {
    console.error("Call Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
