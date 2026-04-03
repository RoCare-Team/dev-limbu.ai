import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

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
    global.mongoose.promise = mongoose.connect(mongooseConnectionUri(MONGODB_URI), {
      bufferCommands: false,
    });
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

// ------------------
// Schema
// ------------------
const ActivitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },

    activities: {
      gmb: {
        enabled: Boolean,
        label: String,
        target: Number,
        done: Number,
        link: String,
        notes: String,
      },
      facebook: {
        enabled: Boolean,
        label: String,
        target: Number,
        done: Number,
        link: String,
        notes: String,
      },
      instagram: {
        enabled: Boolean,
        label: String,
        target: Number,
        done: Number,
        link: String,
        notes: String,
      },
      citations: {
        enabled: Boolean,
        label: String,
        count: Number,
        notes: String,
      },
      services: {
        enabled: Boolean,
        label: String,
        notes: String,
      },
      category: {
        enabled: Boolean,
        label: String,
        notes: String,
      },
    },

    customFields: [
      {
        label: String,
        value: String,
      },
    ],
  },
  { timestamps: true }
);

const UserActivity =
  mongoose.models.UserActivity ||
  mongoose.model("UserActivity", ActivitySchema);

// ------------------
// GET (Fetch by date)
// ------------------
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json({
        success: false,
        message: "userId and date are required",
      });
    }

    const data = await UserActivity.findOne({ userId, date });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({
      success: false,
      message: "Server Error",
    });
  }
}

// ------------------
// POST (Save / Update)
// ------------------
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, date, activities, customFields } = body;

    if (!userId || !date) {
      return NextResponse.json({
        success: false,
        message: "userId and date are required",
      });
    }

    const existing = await UserActivity.findOne({ userId, date });

    if (existing) {
      existing.activities = activities;
      existing.customFields = customFields;
      await existing.save();

      return NextResponse.json({
        success: true,
        message: "Activity updated",
      });
    } else {
      await UserActivity.create({
        userId,
        date,
        activities,
        customFields,
      });

      return NextResponse.json({
        success: true,
        message: "Activity saved",
      });
    }
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({
      success: false,
      message: "Server Error",
    });
  }
}
