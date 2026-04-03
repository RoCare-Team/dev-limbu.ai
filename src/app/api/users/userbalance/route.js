import User from "@/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

// ✅ GET: Fetch all users or single user by userId
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
      bufferCommands: false,
    });
  }
}
export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId"); // Optional query param

    if (userId) {
      // Fetch single user by userId
      const user = await User.findOne({ userId });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, user });
    }

    // If no userId, fetch all users
    const users = await User.find({});
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
