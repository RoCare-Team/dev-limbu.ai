import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();
  const body = await req.json();

  const { userId: incomingUserId, email: incomingEmail, refreshToken, locations, autoReply } = body;

  // Support passing either `userId` or `email`. If only email is provided,
  // resolve to the userId stored in the `User` collection.
  let userId = incomingUserId;
  if (!userId && incomingEmail) {
    const user = await User.findOne({ email: incomingEmail }).lean();
    if (user && user.userId) userId = user.userId;
  }

  // Prevent creating/updating records with a null userId, which would cause all users to share the same record.
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User is not properly authenticated. Provide userId or email." },
      { status: 400 }
    );
  }

  // Validate locations to ensure we can identify the business
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return NextResponse.json(
      { success: false, error: "No location data provided." },
      { status: 400 }
    );
  }

  // Identify the business by the accountId of the first location so we can store per-account settings.
  const accountId = locations[0]?.accountId;
  if (!accountId) {
    return NextResponse.json({ success: false, error: "Invalid location data: missing accountId." }, { status: 400 });
  }

  // Construct update object to avoid overwriting refreshToken with null if not provided
  const updateData = { locations, autoReply, updatedAt: new Date() };
  if (refreshToken) {
    updateData.refreshToken = refreshToken;
  }

  const saved = await AutoReply.findOneAndUpdate(
    { userId, "locations.accountId": accountId },
    { $set: updateData },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({ success: true, data: saved });
}
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    // Accept either `userId` or `email` when fetching settings
    let userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const accountId = searchParams.get("accountId"); // optional but recommended

    if (!userId && email) {
      const user = await User.findOne({ email }).lean();
      if (user && user.userId) userId = user.userId;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId or email is required" },
        { status: 400 }
      );
    }

    let query = { userId };
    if (accountId) query["locations.accountId"] = accountId;

    const autoReplyData = await AutoReply.findOne(query).lean();

    if (!autoReplyData) {
      return NextResponse.json({
        success: true,
        autoReply: false,
        locations: [],
        message: "No auto-reply settings found",
      });
    }

    return NextResponse.json({
      success: true,
      autoReply: autoReplyData.autoReply,
      locations: autoReplyData.locations,
      updatedAt: autoReplyData.updatedAt,
    });
  } catch (error) {
    console.error("GET AutoReply Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}