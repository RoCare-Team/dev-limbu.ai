// app/api/review-app/auto-reply/route.js
// Wrapper around your existing AutoReply model logic
// Mobile app ke liye clean GET/POST endpoints

import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import { NextResponse } from "next/server";

// GET /api/review-app/auto-reply?userId=xxx&accountId=yyy
// Returns current auto-reply status for a user/business
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const accountId = searchParams.get("accountId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required." },
        { status: 400 }
      );
    }

    const query = { userId };
    if (accountId) query["locations.accountId"] = accountId;

    const record = await AutoReply.findOne(query).lean();

    if (!record) {
      return NextResponse.json({
        success: true,
        autoReply: false,
        locations: [],
        message: "No auto-reply settings found. Defaults to OFF.",
      });
    }

    return NextResponse.json({
      success: true,
      autoReply: record.autoReply,
      locations: record.locations,
      updatedAt: record.updatedAt,
    });
  } catch (err) {
    console.error("[GET /api/reviews/auto-reply]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

// POST /api/reviews/auto-reply
// Body: { userId, refreshToken, locations, autoReply }
// Creates or updates auto-reply setting for a business
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, refreshToken, locations, autoReply } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { success: false, error: "locations must be a non-empty array." },
        { status: 400 }
      );
    }

    if (typeof autoReply !== "boolean") {
      return NextResponse.json(
        { success: false, error: "autoReply must be true or false." },
        { status: 400 }
      );
    }

    const accountId = locations[0]?.accountId;
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Invalid location data: missing accountId." },
        { status: 400 }
      );
    }

    const updateData = { locations, autoReply, updatedAt: new Date() };
    if (refreshToken) updateData.refreshToken = refreshToken;

    await AutoReply.findOneAndUpdate(
      { userId, "locations.accountId": accountId },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      autoReply,
      message: `Auto-reply has been turned ${autoReply ? "ON" : "OFF"}.`,
    });
  } catch (err) {
    console.error("[POST /api/reviews/auto-reply]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}