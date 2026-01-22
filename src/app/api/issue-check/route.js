import mongoose from "mongoose";
import { NextResponse } from "next/server";

// ------------------
// DB Connection
// ------------------
const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

// ------------------
// Schema + Model
// ------------------
const IssueSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    issue: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "open",
    },
  },
  { timestamps: true }
);

const Issue = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);

// ------------------
// POST API (Create Issue)
// ------------------
export async function POST(req) {
  try {
    await dbConnect();

    const { userId, fullName, mobile, issue } = await req.json();

    if (!userId || !fullName || !mobile || !issue) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newIssue = await Issue.create({
      userId,
      fullName,
      mobile,
      issue,
    });

    return NextResponse.json({
      success: true,
      message: "Issue reported successfully",
      data: newIssue,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ------------------
// PUT API (Update Status)
// ------------------
export async function PUT(req) {
  try {
    await dbConnect();

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Missing id or status" },
        { status: 400 }
      );
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedIssue,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ------------------
// GET API (By userId OR Get ALL)
// ------------------
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let issues;

    if (userId) {
      // 🔹 Get issues for specific user
      issues = await Issue.find({ userId }).sort({ createdAt: -1 });
    } else {
      // 🔹 Get ALL issues
      issues = await Issue.find().sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
