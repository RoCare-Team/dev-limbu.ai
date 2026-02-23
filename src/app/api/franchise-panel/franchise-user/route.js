import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const referCode = searchParams.get("referCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userType = searchParams.get("userType");
    const leadStage = searchParams.get("leadStage");

    // 1. Base Query (Date & ReferCode) - Used for Stats
    const baseQuery = {
      referCode: { $exists: true, $ne: "" },
    };

    if (referCode) {
      baseQuery.referCode = referCode;
    }

    if (startDate && endDate) {
      baseQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 2. List Query (Base + Filters) - Used for Table
    const listQuery = { ...baseQuery };

    if (userType && userType !== "All") {
      listQuery.userType = userType;
    }

    if (leadStage && leadStage !== "All") {
      listQuery.leadStage = leadStage;
    }

    // Fetch users for the list
    const users = await User.find(listQuery).select(
      "fullName email phone referCode createdAt userType leadStage"
    ).sort({ createdAt: -1 });

    // Calculate stats based on Base Query (Date range only, ignoring type/stage filters)
    const statsAggregation = await User.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: "$leadStage",
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      followUp: 0,
      inactive: 0,
      onboarded: 0,
      active: 0
    };

    statsAggregation.forEach(item => {
      if (item._id === "Follow Up") stats.followUp = item.count;
      else if (item._id === "Inactive") stats.inactive = item.count;
      else if (item._id === "Onboard") stats.onboarded = item.count;
      else if (item._id === "Active") stats.active = item.count;
    });

    // Total count for the period
    stats.total = await User.countDocuments(baseQuery);

    return NextResponse.json({
      success: true,
      total: users.length,
      stats,
      users,
    });
  } catch (error) {
    console.error("Refer code users API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
