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
    const email = searchParams.get("email"); // logged in admin email

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Admin email required" },
        { status: 400 }
      );
    }

    // 1️⃣ find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    let query = {};

    // 2️⃣ agent → only assigned users
    if (admin.role === "agent") {
      query.assignedAgentId = admin._id;
    }

    // 3️⃣ fetch users
    const users = await User.find(query)
      .populate("assignedAgentId", "fullName email role")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      role: admin.role,
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
