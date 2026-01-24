import { NextResponse } from "next/server";
import mongoose from "mongoose";

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

/* ================= ADMIN MODEL ================= */

const AdminSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: {
    type: String,
    enum: ["superAdmin", "admin", "agent"],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Admin =
  mongoose.models.admins || mongoose.model("admins", AdminSchema);

/* ================= USER MODEL ================= */



const UserSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  email: String,
  phone: String,

  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User =
  mongoose.models.users || mongoose.model("users", UserSchema);

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

    // 1️⃣ get active agents
    const agents = await Admin.find({
      role: "agent",
      isActive: true,
    }).sort({ createdAt: 1 });

    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active agents available" },
        { status: 400 }
      );
    }

    // 2️⃣ get round robin index
    let rr = await Setting.findOne({ key: "roundRobinIndex" });
    let index = rr?.value || 0;

    // 3️⃣ select agent
    const assignedAgent = agents[index % agents.length];

    // 4️⃣ update index
    await Setting.findOneAndUpdate(
      { key: "roundRobinIndex" },
      { value: index + 1 },
      { upsert: true }
    );

    // 5️⃣ create user
    const user = await User.create({
      ...body,
      assignedAgentId: assignedAgent._id,
    });

    return NextResponse.json({
      success: true,
      assignedAgent: {
        id: assignedAgent._id,
        name: assignedAgent.fullName,
        email: assignedAgent.email,
      },
      user,
    });

  } catch (error) {
    console.error("POST USER ERROR:", error);
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
    const email = searchParams.get("email");
    const search = searchParams.get("search");

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

    /* 2️⃣ Role-based query */
    let query = {};

    if (admin.role === "agent") {
      // Agent → only assigned users
      query.assignedAgentId = admin._id;
    } 
    // superAdmin / admin → no filter (all users)
    // else if (admin.role === "superAdmin") { query = {}; }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { userId: searchRegex },
      ];
    }

    /* 3️⃣ Fetch users */
    const users = await User.find(query)
      .populate("assignedAgentId", "fullName email role")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      loggedInRole: admin.role,
      totalUsers: users.length,
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

    const {
      userId,
      newPlan,
      remark,
      paidService,
      paidPackage,
      planDuration,
      isServiceBooked,
    } = await req.json();

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

    /* -------- SERVICE UPDATE (ONLY IF BOOKED) -------- */
    if (isServiceBooked === true) {
      updateData.$set = {
        ...updateData.$set,
        ...(paidService && { paidService }),
        ...(paidPackage && { paidPackage }),
        ...(planDuration && { planDuration }),
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
