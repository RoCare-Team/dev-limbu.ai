import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GoogleBusinessProfile from "@/models/GoogleBusinessProfile";
import mongoose from "mongoose";

const AdminBusinessSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  listings: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

function getAdminBusinessModel() {
  return (
    mongoose.models.AdminBusiness ||
    mongoose.model("AdminBusiness", AdminBusinessSchema)
  );
}

export async function POST(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const googleId = url.searchParams.get("googleId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    const profiles = await GoogleBusinessProfile.find(
      googleId ? { userId, googleId } : { userId },
    ).select("email");
    const emails = profiles.map((profile) => profile.email).filter(Boolean);
    const filter = googleId ? { userId, googleId } : { userId };
    const result = googleId
      ? await GoogleBusinessProfile.findOneAndDelete(filter)
      : await GoogleBusinessProfile.deleteMany(filter);

    if (emails.length > 0) {
      const AdminBusiness = getAdminBusinessModel();
      await AdminBusiness.deleteMany({
        userEmail: { $in: emails.map((email) => email.toLowerCase()) },
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: result?.deletedCount ?? (result ? 1 : 0),
    });
  } catch (error) {
    console.error("Disconnect GMB Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
