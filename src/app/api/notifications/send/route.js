// App push notification bhejne ki API (admin JWT ya x-api-key zaroori).
//
// POST body:
//   title, message            (zaroori)
//   target, inme se ek:       token | tokens[] | userId | userIds[] | phone | city | all: true
//                             (city: "Gurgaon" — Gurugram bhi match hota hai)
//   type, screen, action, image, sound, data{}   (optional, app routing ke liye)
//
// userId/phone/all case me User.fcmToken uthaya jata hai; dead tokens apne aap saaf hote hain.
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { checkSender } from "@/lib/notifications/auth";
import { resolveTokens, sendPushToTokens } from "@/lib/notifications/push";

export const dynamic = "force-dynamic"; // build-time prerender skip karega
export const maxDuration = 60; // "all users" me kai batches lag sakte hain

const fail = (status, message) => NextResponse.json({ success: false, message }, { status });

export async function POST(req) {
  const denied = checkSender(req);
  if (denied) return fail(denied.status, denied.message);

  let body;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid JSON body");
  }

  const { title = "", message = "" } = body;
  if (!title || !message) return fail(400, "title and message are required");

  try {
    await dbConnect();

    const target = await resolveTokens(body);
    if (!target) return fail(400, "Send one of: token, tokens, userId, userIds, phone, city or all: true");
    if (!target.tokens.length) return fail(404, "No active FCM token found for this target");

    const result = await sendPushToTokens(target.tokens, {
      title,
      message,
      type: body.type || "",
      screen: body.screen || "",
      action: body.action || "",
      image: body.image || "",
      sound: body.sound || "",
      data: body.data,
    });

    return NextResponse.json({
      success: true,
      message: "Notification send attempt completed",
      targetedDevices: target.tokens.length,
      matchedUsers: target.matchedUsers,
      ...result,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return fail(500, error.message || "Failed to send notification");
  }
}
