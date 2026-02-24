import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not defined in environment");
}

const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
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

export async function GET(req) {
  try {
    await connectDB();

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Token missing" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const email = decoded.email?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "No email found in token" },
        { status: 400 }
      );
    }

    const business = await AdminBusiness.findOne({
      userEmail: email,
    });

    return NextResponse.json({
      success: true,
      listings: business?.listings || [],
    });

  } catch (err) {
    console.error("Fetch listings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
