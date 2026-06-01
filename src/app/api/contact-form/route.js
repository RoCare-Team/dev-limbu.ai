import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import User from "@/models/User";

// DB CONNECT
async function dbConnect() {
  if (mongoose.connection.readyState === 1) return;

  return mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
    bufferCommands: false,
  });
}

// SCHEMA
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "contactForm",
  },
);

const Contact =
  mongoose.models.contactForm || mongoose.model("contactForm", ContactSchema);

// POST API
export async function POST(request) {
  try {
    await dbConnect();

    const { name, email, phone, message } = await request.json();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    // SAVE CONTACT LEAD
    const saved = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    // CHECK EXISTING USER
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    // CREATE USER MANAGEMENT LEAD
    if (!existingUser) {
      await User.create({
        userId: `CF${Date.now()}`,

        fullName: name,
        email,
        phone,

        source: "signup",

        assignedAgentId: null,

        leadStage: "Active",
        leadStatus: "",

        wallet: 0,
        freeUsedCount: 0,

        subscription: {
          status: "inactive",
          plan: "Free",
          maxAccounts: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Message saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET API
export async function GET() {
  try {
    await dbConnect();

    const data = await Contact.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE API
export async function DELETE(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    await Contact.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
