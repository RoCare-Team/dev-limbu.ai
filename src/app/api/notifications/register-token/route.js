// App ka FCM token save/clear karne ki API. Header: Authorization: Bearer <app login token>.
//
// POST   { fcmToken }  -> token save (app open hone par aur Firebase onTokenRefresh par call karo)
// DELETE               -> token hatao (logout par), taaki logout ke baad notification na aaye
//
// userId hamesha login token se aata hai, body se nahi — koi doosre user ka token nahi badal sakta.
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { appUserId } from "@/lib/notifications/auth";

export const dynamic = "force-dynamic";

const fail = (status, message) => NextResponse.json({ success: false, message }, { status });

export async function POST(req) {
  const userId = appUserId(req);
  if (!userId) return fail(401, "Unauthorized");

  let body;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid JSON body");
  }
  const fcmToken = String(body?.fcmToken || "").trim();
  if (!fcmToken || fcmToken.length > 4096) return fail(400, "fcmToken is required");

  try {
    await dbConnect();
    // Ek device ek hi user ka: same phone par doosre account ka purana token hatao
    await User.updateMany({ fcmToken, userId: { $ne: userId } }, { $set: { fcmToken: null } });
    const res = await User.updateOne({ userId }, { $set: { fcmToken } });
    if (!res.matchedCount) return fail(404, "User not found");
    return NextResponse.json({ success: true, message: "FCM token saved" });
  } catch (error) {
    console.error("register-token error:", error);
    return fail(500, "Failed to save token");
  }
}

export async function DELETE(req) {
  const userId = appUserId(req);
  if (!userId) return fail(401, "Unauthorized");
  try {
    await dbConnect();
    await User.updateOne({ userId }, { $set: { fcmToken: null } });
    return NextResponse.json({ success: true, message: "FCM token removed" });
  } catch (error) {
    console.error("register-token delete error:", error);
    return fail(500, "Failed to remove token");
  }
}
