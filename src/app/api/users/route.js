import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import Admin from "@/models/Admin";

/* ================= DB CONNECT ================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(MONGODB_URI);
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

/* ================= SETTING MODEL (ROUND ROBIN) ================= */

const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});

const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema);

/* ============================================================
   POST → CREATE USER + ROUND ROBIN ASSIGNMENT
   ============================================================ */

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing body" },
        { status: 400 }
      );
    }

    // Generate userId if not provided
    if (!body.userId) {
      body.userId = `USR${Date.now()}`;
    }

    // 1️⃣ Fetch ONLY active agents
    const agents = await Admin.find({ role: "agent", isActive: true })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    let assignedAgentId = null;
    let rrValue = 0;
    let assignedAgent = null;

    if (agents && agents.length > 0) {
      // 2️⃣ Round Robin Counter
      const RR_KEY = "agentLeadRR";

      let rrDoc = await Setting.findOne({ key: RR_KEY });

      if (!rrDoc) {
        rrDoc = await Setting.create({ key: RR_KEY, value: 0 });
      } else {
        rrDoc.value += 1;
        await rrDoc.save();
      }

      // ✅ FIXED HERE
      rrValue = parseInt(rrDoc.value, 10);
      if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

      // 3️⃣ Round robin index
      const index = rrValue % agents.length;
      assignedAgent = agents[index];
      if (assignedAgent) {
        assignedAgentId = assignedAgent._id;
      }
    }

    // 4️⃣ Create Lead
    const createPayload = { ...body, assignedAgentId: assignedAgentId };
    const user = await User.create(createPayload);

    return NextResponse.json({
      success: true,
      message: assignedAgentId ? "Agent assigned via round robin successfully" : "User created (Unassigned)",
      assignedAgent: assignedAgent ? {
        id: assignedAgent._id,
        name: assignedAgent.fullName || assignedAgent.name,
      } : null,
      rrIndex: rrValue,
      totalAgents: agents ? agents.length : 0,
      user,
    });

  } catch (error) {
    console.error("ROUND ROBIN FAILED:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}





/* ------------------ PATCH: ASSIGN AGENT ------------------ */
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, assignedAgentId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { assignedAgentId: assignedAgentId || null } },
      { new: true }
    ).populate("assignedAgentId", "fullName email role mobileNumber");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent assigned successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET → ROLE BASED USERS (ADMIN vs AGENT)
   ============================================================ */

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const user = await User.findOne({ userId }).populate("assignedAgentId", "fullName email role mobileNumber");
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, user });
    }

    const email = searchParams.get("email");
    const search = searchParams.get("search");
    const assignedAgentId = searchParams.get("assignedAgentId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 70;
    
    
    // Date filter parameters
    const dateFilter = searchParams.get("dateFilter");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const leadStatus = searchParams.get("leadStatus");
    const leadStage = searchParams.get("leadStage");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Admin email required" },
        { status: 400 }
      );
    }
    /* 1️⃣ Find logged-in admin */
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    /* 🔍 Fetch Agent Stats (Total Counts) */
    if (searchParams.get("getAgentStats") === "true") {
      const matchStage = {};

      if (admin.role === "agent") {
        matchStage.assignedAgentId = admin._id;
      } else if (assignedAgentId) {
        if (assignedAgentId === "Unassigned") {
          matchStage.assignedAgentId = null;
        } else {
          matchStage.assignedAgentId = new mongoose.Types.ObjectId(assignedAgentId);
        }
      }

      if (dateFilter && startDateParam && endDateParam) {
        const startDate = new Date(startDateParam);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
      }

      if (leadStatus && leadStatus !== "All") {
        if (leadStatus === "Untagged") {
          matchStage.leadStatus = { $in: ["", null, undefined] };
        } else {
          matchStage.leadStatus = leadStatus;
        }
      }

      if (leadStage && leadStage !== "All") {
        if (leadStage === "Active") {
          matchStage.leadStage = { $in: ["Active", "", null] };
        } else {
          matchStage.leadStage = leadStage;
        }
      }

      const stats = await User.aggregate([
        {
          $match: matchStage
        },
        {
          $group: {
            _id: {
              agent: "$assignedAgentId",
              stage: { $ifNull: ["$leadStage", "Active"] },
              leadStatus: { $ifNull: ["$leadStatus", "Cold"] }
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const agentStats = { "Unassigned": 0 };
      const stageStats = {
        "Active": 0,
        "Follow Up": 0,
        "Inactive": 0,
        "Onboard": 0
      };
      const leadStatusStats = {
        "Hot": 0,
        "Warm": 0,
        "Cold": 0
      };
      const detailedStats = [];

      stats.forEach((item) => {
        const agentId = item._id.agent ? item._id.agent.toString() : "Unassigned";
        const stage = item._id.stage;
        const leadStatus = item._id.leadStatus || "Cold";
        const count = item.count;

        // Agent Totals
        agentStats[agentId] = (agentStats[agentId] || 0) + count;

        // Stage Totals
        stageStats[stage] = (stageStats[stage] || 0) + count;

        // Lead Status Totals
        leadStatusStats[leadStatus] = (leadStatusStats[leadStatus] || 0) + count;

        // Detailed Breakdown
        detailedStats.push({ stage, agentId, leadStatus, count });
      });

      let superAdminStats = {};
      if (admin.role === "superAdmin") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [totalSignups, totalMetaLeads, todayLeads, todayAgentAssignments] = await Promise.all([
          User.countDocuments({}),
          User.countDocuments({ source: "Meta" }),
          User.countDocuments({ createdAt: { $gte: startOfDay } }),
          User.aggregate([
            { $match: { createdAt: { $gte: startOfDay }, assignedAgentId: { $ne: null } } },
            { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
            { $lookup: { from: "admins", localField: "_id", foreignField: "_id", as: "agent" } },
            { $unwind: "$agent" },
            { $project: { agentName: "$agent.fullName", count: 1 } }
          ])
        ]);

        superAdminStats = {
          totalSignups,
          totalMetaLeads,
          todayLeads,
          todayAgentAssignments
        };
      }

      return NextResponse.json({ success: true, stats: agentStats, stageStats, leadStatusStats, detailedStats, ...superAdminStats });
    }

    /* 🔍 Fetch Today's Users Count */
    if (searchParams.get("getTodayUsersCount") === "true") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayUsersCount = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // Get breakdown by source for today
      const todayBySource = await User.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: "$source", count: { $sum: 1 } } }
      ]);

      const sourceBreakdown = {};
      todayBySource.forEach(item => {
        sourceBreakdown[item._id || "unknown"] = item.count;
      });

      // Get today's meta leads count
      const todayMetaLeads = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        source: { $in: ["bulk-upload", "Meta Leads", "Meta"] }
      });

      // Get today's signups count
      const todaySignups = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        source: { $nin: ["bulk-upload", "Meta Leads", "Meta"] }
      });

      return NextResponse.json({ 
        success: true, 
        todayUsersCount,
        todayMetaLeads,
        todaySignups,
        sourceBreakdown
      });
    }

    /* 2️⃣ Role-based query */
    let query = {};

    if (admin.role === "agent") {
      // Agent → only assigned users
      query.assignedAgentId = admin._id;
    } else if (assignedAgentId) {
      // Admin filtering by agent
      if (assignedAgentId === "Unassigned") {
        query.assignedAgentId = null;
      } else {
        query.assignedAgentId = assignedAgentId;
      }
    }

    // Date filtering logic
    if (dateFilter && startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Lead Status filtering
    if (leadStatus && leadStatus !== "All") {
      if (leadStatus === "Untagged") {
        query.leadStatus = { $in: ["", null, undefined] };
      } else {
        query.leadStatus = leadStatus;
      }
    }

    // Lead Stage filtering
    if (leadStage && leadStage !== "All") {
      if (leadStage === "Active") {
        query.leadStage = { $in: ["Active", "", null] };
      } else {
        query.leadStage = leadStage;
      }
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchConditions = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { userId: searchRegex },
      ];

      if (Object.keys(query).length > 0) {
        query = { $and: [query, { $or: searchConditions }] };
      } else {
        query = { $or: searchConditions };
      }
    }

    const totalUsers = await User.countDocuments(query);
    const skip = (page - 1) * limit;

    /* 3️⃣ Fetch users */
    const users = await User.find(query)
      .populate("assignedAgentId", "fullName email role mobileNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    let superAdminData = {};
    if (admin.role === "superAdmin") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [totalSignups, totalMetaLeads, todayLeads, todayAgentAssignments] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ source: "Meta" }),
        User.countDocuments({ createdAt: { $gte: startOfDay } }),
        User.aggregate([
          { $match: { createdAt: { $gte: startOfDay }, assignedAgentId: { $ne: null } } },
          { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
          { $lookup: { from: "admins", localField: "_id", foreignField: "_id", as: "agent" } },
          { $unwind: "$agent" },
          { $project: { agentName: "$agent.fullName", count: 1 } }
        ])
      ]);

      superAdminData = {
        totalSignups,
        totalMetaLeads,
        todayLeads,
        todayAgentAssignments
      };
    }

    return NextResponse.json({
      success: true,
      loggedInRole: admin.role,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
      ...superAdminData,
    });

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      userId,
      newPlan,
      paidService,
      paidPackage,
      planDuration,
      isServiceBooked,
      planExpiry,
      leadStage,
      leadStatus,
    } = body;

    const remark = body.remark || body.remarks;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    let updateData = {};

    /* -------- REMARK UPDATE -------- */
    if (remark) {
      updateData.$set = { Remarks: remark };
      updateData.$push = {
        remarksHistory: { text: remark, createdAt: new Date() },
      };
    }

    /* -------- PLAN UPDATE -------- */
    if (newPlan) {
      updateData.$set = {
        ...updateData.$set,
        "subscription.plan": newPlan,
        "subscription.status": "active",
        "subscription.date": new Date(),
      };
    }

    /* -------- SERVICE UPDATE -------- */
    if (isServiceBooked === true) {
      updateData.$set = {
        ...updateData.$set,
        ...(paidService && { paidService }),
        ...(paidPackage && { paidPackage }),
        ...(planDuration && { planDuration }),
      };
    }

    /* -------- LEAD STAGE UPDATE -------- */
    if (leadStage) {
      updateData.$set = {
        ...updateData.$set,
        leadStage,
      };
    }

    /* -------- LEAD STATUS UPDATE (HOT/WARM/COLD) -------- */
    if (leadStatus !== undefined) {
      updateData.$set = {
        ...updateData.$set,
        leadStatus,
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ------------------ DELETE USER ------------------ */
export async function DELETE(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const deletedUser = await User.findOneAndDelete({ userId });

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User with ID ${userId} deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
