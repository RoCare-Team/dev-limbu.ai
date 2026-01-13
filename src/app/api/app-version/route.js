import { NextResponse } from "next/server";
import mongoose from "mongoose";

/* ----------------- DB CONNECTION ----------------- */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI in .env file");
}

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const db = await mongoose.connect(MONGODB_URI);
  isConnected = db.connections[0].readyState;
  console.log("MongoDB Connected");
}

/* ----------------- SCHEMA ----------------- */
const AppVersionSchema = new mongoose.Schema(
  {
    android_version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    ios_version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    is_force_update: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AppVersion =
  mongoose.models.AppVersion ||
  mongoose.model("AppVersion", AppVersionSchema);

/* ----------------- API ----------------- */
export async function GET() {
  try {
    await connectDB();

    let version = await AppVersion.findOne();

    // First time DB empty ho to default insert
    if (!version) {
      version = await AppVersion.create({
        android_version: "14.0.1",
        ios_version: "2.0.1",
        is_force_update: false,
      });
    }

    return NextResponse.json({
      error: false,
      "App Version": version,
    });
  } catch (error) {
    return NextResponse.json(
      { error: true, message: error.message },
      { status: 500 }
    );
  }
}
