import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Admin from "@/models/Admin";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");
    // filter: "today" | "tomorrow" | "next7days" | "thisMonth" | "all"
    const filter = searchParams.get("filter") || "all";

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email is required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("fullName role _id");
    if (!admin || !["superAdmin", "admin", "agent"].includes(admin.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const isAgent = admin.role === "agent";
    const agentNameRegex = isAgent
      ? new RegExp(`^${admin.fullName?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      : null;

    /* ── Date buckets ── */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const next7DaysStart = new Date(todayStart);
    const next7DaysEnd = new Date(todayStart);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

    const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const thisMonthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    /* ── Build date range from filter ── */
    let dateFilter = { $ne: null, $exists: true };
    if (filter === "today")     dateFilter = { $gte: todayStart,       $lt: tomorrowStart  };
    if (filter === "tomorrow")  dateFilter = { $gte: tomorrowStart,    $lt: tomorrowEnd    };
    if (filter === "next7days") dateFilter = { $gte: todayStart,       $lt: next7DaysEnd   };
    if (filter === "thisMonth") dateFilter = { $gte: thisMonthStart,   $lt: thisMonthEnd   };

    const agentMatch = isAgent ? { "remarksHistory.agentName": { $regex: agentNameRegex } } : {};

    /* ── Leads pipeline (paginated) ── */
    const leadsPipeline = [
      { $unwind: "$remarksHistory" },
      {
        $match: {
          "remarksHistory.followUpDate": dateFilter,
          ...agentMatch,
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
          assignedAgentId: 1,
          remark: "$remarksHistory.text",
          followUpDate: "$remarksHistory.followUpDate",
          agentName: "$remarksHistory.agentName",
          createdAt: "$remarksHistory.createdAt",
        }
      }
    ];

    /* ── Count buckets (always returned regardless of filter) ── */
    const makeBucketCount = (start, end) => [
      { $unwind: "$remarksHistory" },
      {
        $match: {
          "remarksHistory.followUpDate": { $gte: start, $lt: end },
          ...agentMatch,
        }
      },
      { $count: "total" }
    ];

    const makeTotalCount = () => [
      { $unwind: "$remarksHistory" },
      {
        $match: {
          "remarksHistory.followUpDate": { $ne: null, $exists: true },
          ...agentMatch,
        }
      },
      { $count: "total" }
    ];

    const [
      leadsResult,
      todayResult,
      tomorrowResult,
      next7Result,
      thisMonthResult,
      totalResult,
    ] = await Promise.all([
      User.aggregate(leadsPipeline),
      User.aggregate(makeBucketCount(todayStart, tomorrowStart)),
      User.aggregate(makeBucketCount(tomorrowStart, tomorrowEnd)),
      User.aggregate(makeBucketCount(todayStart, next7DaysEnd)),
      User.aggregate(makeBucketCount(thisMonthStart, thisMonthEnd)),
      User.aggregate(makeTotalCount()),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalFollowUps:    totalResult[0]?.total    || 0,
        todayFollowUps:    todayResult[0]?.total    || 0,
        tomorrowFollowUps: tomorrowResult[0]?.total || 0,
        next7DaysFollowUps: next7Result[0]?.total   || 0,
        thisMonthFollowUps: thisMonthResult[0]?.total || 0,
        leads: leadsResult,
      }
    });

  } catch (error) {
    console.error("Follow-up Stats API Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
