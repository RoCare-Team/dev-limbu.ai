import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import Lead from "@/models/MetaLeadFranchises";

/** Day boundaries in Asia/Kolkata as UTC Date values (India has no DST). */
function getISTDayRange() {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)) {
    if (type !== "literal") parts[type] = value;
  }
  const todayStart = new Date(
    `${parts.year}-${parts.month}-${parts.day}T00:00:00+05:30`,
  );
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  return { todayStart, tomorrowStart };
}

// ==================================================================
// GET: PER-AGENT FRANCHISE LEAD STATS (whole database, not one page)
//   Answers: how many leads each agent holds, how many they onboarded,
//   and how many leads came in today — for the super-admin dashboard.
// ==================================================================
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("email");

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({ email: adminEmail }).select("role");
    if (
      !admin ||
      !["superAdmin", "superFranchiseAdmin"].includes(admin.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { todayStart, tomorrowStart } = getISTDayRange();

    const todayCond = {
      $and: [
        { $gte: ["$createdTime", todayStart] },
        { $lt: ["$createdTime", tomorrowStart] },
      ],
    };

    const grouped = await Lead.aggregate([
      {
        $group: {
          _id: "$assignedFranchiseAdminId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
          },
          followUp: {
            $sum: { $cond: [{ $eq: ["$status", "Follow Up"] }, 1, 0] },
          },
          onboard: {
            $sum: { $cond: [{ $eq: ["$status", "Onboard"] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] },
          },
          today: { $sum: { $cond: [todayCond, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "_id",
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $addFields: {
          agentName: { $arrayElemAt: ["$admin.fullName", 0] },
          isActive: { $arrayElemAt: ["$admin.isActive", 0] },
        },
      },
      { $project: { admin: 0 } },
      { $sort: { total: -1 } },
    ]);

    let unassigned = {
      total: 0,
      active: 0,
      followUp: 0,
      onboard: 0,
      inactive: 0,
      today: 0,
    };
    const perAgent = [];

    for (const row of grouped) {
      const clean = {
        total: row.total || 0,
        active: row.active || 0,
        followUp: row.followUp || 0,
        onboard: row.onboard || 0,
        inactive: row.inactive || 0,
        today: row.today || 0,
      };
      if (!row._id) {
        unassigned = clean;
      } else {
        perAgent.push({
          _id: String(row._id),
          agentName: row.agentName || "Unknown Agent",
          isActive: row.isActive !== false,
          ...clean,
        });
      }
    }

    const totals = perAgent.reduce(
      (acc, a) => {
        acc.total += a.total;
        acc.active += a.active;
        acc.followUp += a.followUp;
        acc.onboard += a.onboard;
        acc.inactive += a.inactive;
        acc.today += a.today;
        return acc;
      },
      {
        total: 0,
        active: 0,
        followUp: 0,
        onboard: 0,
        inactive: 0,
        today: 0,
      },
    );

    return NextResponse.json({
      success: true,
      stats: {
        perAgent,
        unassigned,
        // Grand totals across the whole database
        totalLeads: totals.total + unassigned.total,
        totalOnboard: totals.onboard + unassigned.onboard,
        // Today's intake (all leads created today, IST)
        todayTotal: totals.today + unassigned.today,
        todayAssigned: totals.today,
        todayUnassigned: unassigned.today,
      },
    });
  } catch (error) {
    console.error("Franchise agent stats error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
