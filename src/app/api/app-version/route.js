import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

/* ----------------- DB CONNECTION ----------------- */
let isConnected = false;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Please add ${name} in .env file`);
  return value;
}

async function connectDB() {
  if (isConnected) return;

  const mongoUri = mongooseConnectionUri(getRequiredEnv("MONGODB_URI"));
  const db = await mongoose.connect(mongoUri);
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
