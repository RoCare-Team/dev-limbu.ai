import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

let isConnected = false;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

async function connectDB() {
  if (isConnected) return;
  const mongoUri = getRequiredEnv("MONGODB_URI");
  await mongoose.connect(mongoUri);
  isConnected = true;
}

const AdminBusinessSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  listings: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

const AdminBusiness =
  mongoose.models.AdminBusiness ||
  mongoose.model("AdminBusiness", AdminBusinessSchema);

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userEmail, listings } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(listings)) {
      return NextResponse.json(
        { error: "Listings must be an array" },
        { status: 400 }
      );
    }

    const updatedBusiness = await AdminBusiness.findOneAndUpdate(
      { userEmail: userEmail.toLowerCase() },
      {
        userEmail: userEmail.toLowerCase(),
        listings,
        timestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      listings: updatedBusiness.listings,
    });

  } catch (err) {
    console.error("Save listings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}