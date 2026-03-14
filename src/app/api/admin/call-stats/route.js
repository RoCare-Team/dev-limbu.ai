import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

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

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role");

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

    /* ================= TODAY CALLS ================= */

    const todayCallsByAgent = await User.aggregate([
      { $unwind: "$callHistory" },
      {
        $match: {
          "callHistory.calledAt": { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: "$callHistory.agentName" }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          agentName: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    /* ================= TOTAL CALLS ================= */

    const totalCallsByAgent = await User.aggregate([
      { $unwind: "$callHistory" },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: "$callHistory.agentName" }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          agentName: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    /* ================= TOTAL CALLS TODAY ================= */

    const totalCallsToday = todayCallsByAgent.reduce(
      (sum, agent) => sum + agent.count,
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        todayCallsByAgent,
        totalCallsByAgent,
        totalCallsToday
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