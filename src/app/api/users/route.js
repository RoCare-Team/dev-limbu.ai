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

    // 1️⃣ Fetch ONLY active agents (stable order)
    const agents = await Admin.find({
      role: "agent",
      isActive: true,
    })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    if (!agents.length) {
      return NextResponse.json(
        { success: false, message: "No active agents found" },
        { status: 400 }
      );
    }

    // 2️⃣ ONE round-robin key (atomic + safe)
    const RR_KEY = "agentLeadRR";

    const rr = await Setting.findOneAndUpdate(
      { key: RR_KEY },
      { $inc: { value: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // 🛡️ Safety: ensure numeric value
    const rrValue = Number(rr.value) || 1;

    // 3️⃣ Proper round-robin index
    const index = (rrValue - 1) % agents.length;
    const assignedAgent = agents[index];

    // 4️⃣ Create lead / user
    const user = await User.create({
      ...body,
      assignedAgentId: assignedAgent._id,
    });

    return NextResponse.json({
      success: true,
      message: "Agent assigned via round robin successfully",
      assignedAgent: {
        id: assignedAgent._id,
        name: assignedAgent.fullName,
      },
      rrIndex: rrValue,
      totalAgents: agents.length,
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
      const stats = await User.aggregate([
        {
          $group: {
            _id: {
              agent: "$assignedAgentId",
              stage: { $ifNull: ["$leadStage", "Active"] }
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
      const detailedStats = [];

      stats.forEach((item) => {
        const agentId = item._id.agent ? item._id.agent.toString() : "Unassigned";
        const stage = item._id.stage;
        const count = item.count;

        // Agent Totals
        agentStats[agentId] = (agentStats[agentId] || 0) + count;

        // Stage Totals
        stageStats[stage] = (stageStats[stage] || 0) + count;

        // Detailed Breakdown
        detailedStats.push({ stage, agentId, count });
      });

      return NextResponse.json({ success: true, stats: agentStats, stageStats, detailedStats });
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

    return NextResponse.json({
      success: true,
      loggedInRole: admin.role,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
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
      leadStage, // ✅ shifted from userStatus
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

    /* -------- LEAD STAGE UPDATE (SHIFTED) -------- */
    if (leadStage) {
      updateData.$set = {
        ...updateData.$set,
        leadStage,
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
