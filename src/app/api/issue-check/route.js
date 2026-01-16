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

const Issue =
  mongoose.models.Issue || mongoose.model("Issue", IssueSchema);

// ------------------
// POST API
// ------------------
export async function POST(req) {
  try {
    await dbConnect();

    const { userId, issue } = await req.json();

    if (!userId || !issue) {
      return NextResponse.json(
        { success: false, message: "Missing userId or issue" },
        { status: 400 }
      );
    }

    const newIssue = await Issue.create({
      userId,
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
