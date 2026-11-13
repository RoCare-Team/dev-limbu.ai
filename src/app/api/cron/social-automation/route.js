import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SocialAutomation from "@/models/SocialAutomation";
import { runSocialAutomation } from "@/lib/social/automationEngine";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET /api/cron/social-automation — every 10 minutes (vercel.json / EC2 cron).
 * Runs comment auto reply, DM auto reply and negative comment moderation for
 * every user who switched one on. If CRON_SECRET is set it must be sent as
 * Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const users = await SocialAutomation.find({
    $or: [{ "commentReply.enabled": true }, { "dmReply.enabled": true }, { "moderation.enabled": true }],
  }).lean();

  const results = [];
  for (const settings of users) {
    try {
      const { actions, errors } = await runSocialAutomation(settings);
      await SocialAutomation.updateOne({ _id: settings._id }, { $set: { lastRunAt: new Date(), lastError: errors.join(" | ").slice(0, 500) } });
      results.push({ userId: settings.userId, actions, errors: errors.length });
    } catch (err) {
      console.error("[social-automation]", settings.userId, err);
      await SocialAutomation.updateOne({ _id: settings._id }, { $set: { lastRunAt: new Date(), lastError: err.message.slice(0, 500) } });
      results.push({ userId: settings.userId, error: err.message });
    }
  }
  return NextResponse.json({ success: true, users: users.length, results });
}
