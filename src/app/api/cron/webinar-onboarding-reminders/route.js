import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendWebinarReminderForUser } from "@/lib/onboardingNewUser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isCronAuthOk =
    isVercelCron ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isCronAuthOk) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = new Date();

    const users = await User.find({
      source: { $in: ["signup", "Meta Lead", "bulk-upload"] },
      onboardingWebinarSessionAt: { $exists: true, $ne: null },
      onboardingWebinarReminderAt: { $lte: now },
      onboardingWebinarReminderSent: { $ne: true },
      phone: { $exists: true, $nin: [null, ""] },
    })
      .limit(200)
      .lean();

    let sent = 0;
    for (const row of users) {
      const u = await User.findById(row._id);
      if (!u || u.onboardingWebinarReminderSent) continue;
      if (!u.onboardingWebinarReminderAt || u.onboardingWebinarReminderAt > now) {
        continue;
      }

      const r = await sendWebinarReminderForUser(u);
      if (r.ok) {
        u.onboardingWebinarReminderSent = true;
        await u.save();
        sent++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: users.length,
      remindersSent: sent,
    });
  } catch (e) {
    console.error("webinar-onboarding-reminders", e);
    return NextResponse.json(
      { success: false, error: e?.message || "error" },
      { status: 500 },
    );
  }
}
