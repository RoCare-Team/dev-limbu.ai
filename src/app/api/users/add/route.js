import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

const MONGODB_URI = process.env.MONGODB_URI;

// --------------------
// Schema
// --------------------
const UserSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  email: String,
  phone: String,

  // Agent this lead belongs to. ObjectId — every other query filters on that
  // type, and a string here would silently drop the lead out of those filters.
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, default: null },

  wallet: Number,
  freeUsedCount: Number,
  referCode: String,

  subscription: {
    plan: String,
    status: String,
    paymentId: String,
    orderId: String,
    startDate: Date,
    endDate: Date,
    date: Date
  },

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.users || mongoose.model("users", UserSchema);

// --------------------
// MongoDB Connect
// --------------------
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongooseConnectionUri(MONGODB_URI));
  }
}

// --------------------
// POST: Add New User
// --------------------
export async function POST(req) {
  try {
    await connectDB();

    const { fullName, email, phone, city, referCode, plan, assignedAgentId } =
      await req.json();

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Full Name & Email required" },
        { status: 400 }
      );
    }

    // Assignment is optional; a malformed id is refused rather than quietly
    // creating an unassigned lead the admin believes is assigned.
    let agentId = null;
    if (assignedAgentId) {
      if (!mongoose.Types.ObjectId.isValid(assignedAgentId)) {
        return NextResponse.json(
          { success: false, error: "Invalid agent selected" },
          { status: 400 }
        );
      }
      agentId = new mongoose.Types.ObjectId(assignedAgentId);
    }

    // Auto-Generate User ID
    const generatedId = `USR${Date.now()}`;

    const newUser = await User.create({
      userId: generatedId,
      fullName,
      referCode,
      email,
      phone,
      city: typeof city === "string" ? city.trim() : "",
      assignedAgentId: agentId,

      // Default wallet & usage
      wallet: 500,
      freeUsedCount: 2,

      // Default subscription
      subscription: {
        plan: plan || "Free",
        status: plan === "Free" ? "inactive" : "active",
        paymentId: "",
        orderId: "",
        startDate: null,
        endDate: null,
        date: new Date(),
      },

      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });

  } catch (error) {
    console.error("Add User Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
