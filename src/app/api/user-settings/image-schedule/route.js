import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AutomationPlan from "@/models/AutomationPlan";
import {
  ASSET_SLOTS,
  resolveImagesForIndex,
} from "@/lib/automationPlanContentGeneration";
import { zonedYmdString } from "@/utils/postingScheduleWindow";

/**
 * "Which images go out on which day."
 *
 * The answer is computed here rather than in the browser so the preview uses
 * the SAME resolver the crons use — a preview that drifts from what actually
 * publishes would be worse than no preview.
 */

// The preview covers the ENTIRE remaining plan by default — a user setting up
// images once wants to see every post they are paying for. The ceiling only
// exists so a corrupt schedule cannot build an unbounded response.
const MAX_DAYS = 400;

async function findPlan(userId) {
  return AutomationPlan.findOne({ userId, active: true }).sort({ updatedAt: -1 });
}

/** How many posts the plan still has to publish, as far as we can tell. */
function postsRemaining(plan) {
  const limit = plan.planDetails?.limit ?? plan.queueTiming?.postLimit ?? 0;
  const used = plan.planDetails?.postsUsed ?? plan.postIndex ?? 0;
  const left = Number(limit) - Number(used);
  return Number.isFinite(left) && left > 0 ? left : 0;
}

/**
 * The upcoming posting days, in order. Uses the plan's own computed schedule
 * when it has one; otherwise walks forward from today by the cadence step.
 */
function upcomingDates(plan, limit) {
  const tz = plan.postingTimezone || "Asia/Kolkata";
  const todayKey = zonedYmdString(new Date(), tz);

  const sched = Array.isArray(plan.schedule) ? plan.schedule : [];
  if (sched.length) {
    return sched
      .map((d) => zonedYmdString(d, tz))
      .filter((key) => key && key >= todayKey)
      .slice(0, limit);
  }

  const stepDays = { daily: 1, twicedaily: 1, alternate: 2, weekly: 7, monthly: 30 }[
    plan.frequency
  ] ?? 1;
  const out = [];
  const start = new Date();
  for (let i = 0; out.length < limit && i < limit * stepDays + 1; i += stepDays) {
    out.push(zonedYmdString(new Date(start.getTime() + i * 86400000), tz));
  }
  return out;
}

// -----------------------------
// GET — the schedule preview (?userId=&days=14)
// -----------------------------
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const askedDays = Number(searchParams.get("days"));

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });
    }

    const plan = await findPlan(userId);
    if (!plan) {
      return NextResponse.json({ success: true, schedule: [], pools: {}, startIndex: 0 });
    }

    const imageConfig = plan.imageConfig || {};
    const startIndex = plan.postIndex || 0;
    const overrides = imageConfig.overrides || [];

    // Whole plan unless the caller asked for a specific number of days.
    const sched = Array.isArray(plan.schedule) ? plan.schedule : [];
    const fullLength = sched.length || postsRemaining(plan) || 30;
    const days = Math.min(
      MAX_DAYS,
      Math.max(1, Number.isFinite(askedDays) && askedDays > 0 ? askedDays : fullLength),
    );

    const schedule = upcomingDates(plan, days).map((date, n) => {
      // The nth upcoming post continues the counter the crons are on.
      const images = resolveImagesForIndex(imageConfig, startIndex + n, date);
      const pinned = overrides.find((o) => o?.date === date)?.images || {};

      return {
        date,
        images: Object.fromEntries(ASSET_SLOTS.map((s) => [s, images[s] || null])),
        pinnedSlots: ASSET_SLOTS.filter((s) => pinned[s]),
      };
    });

    return NextResponse.json({
      success: true,
      schedule,
      startIndex,
      totalPlanned: schedule.length,
      postsRemaining: postsRemaining(plan),
      pools: Object.fromEntries(
        ASSET_SLOTS.map((s) => [s, imageConfig.pools?.[s] || []])
      ),
    });
  } catch (error) {
    console.error("IMAGE SCHEDULE GET ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// -----------------------------
// PUT — pin an image to one day  { userId, date, slot, url }
//       url: null clears that slot's pin for the day
// -----------------------------
export async function PUT(req) {
  try {
    await dbConnect();
    const { userId, date, slot, url } = await req.json();

    if (!userId || !date || !ASSET_SLOTS.includes(slot)) {
      return NextResponse.json(
        { success: false, error: "userId, date and a valid slot are required." },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: "date must be YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const plan = await findPlan(userId);
    if (!plan) {
      return NextResponse.json({ success: false, error: "No automation plan found." }, { status: 404 });
    }

    // Only an image already in that slot's pool can be pinned — otherwise a
    // stale URL could quietly end up in a published post.
    const pool = plan.imageConfig?.pools?.[slot] || [];
    if (url && !pool.includes(url)) {
      return NextResponse.json(
        { success: false, error: "That image is not in this slot's pool." },
        { status: 400 }
      );
    }

    const overrides = (plan.imageConfig?.overrides || []).map((o) => ({
      date: o.date,
      images: { ...(o.images || {}) },
    }));
    const row = overrides.find((o) => o.date === date);

    if (row) {
      row.images[slot] = url || null;
    } else if (url) {
      overrides.push({ date, images: { [slot]: url } });
    }

    // Drop days that no longer pin anything, so the array stays small.
    const cleaned = overrides.filter((o) =>
      ASSET_SLOTS.some((s) => o.images?.[s])
    );

    await AutomationPlan.updateOne(
      { _id: plan._id },
      { $set: { "imageConfig.overrides": cleaned } }
    );

    // Read back rather than echoing what we meant to write: if the running
    // server holds an older schema, Mongoose silently drops unknown paths and
    // the caller would otherwise be told the pin was saved when it was not.
    const saved = await AutomationPlan.findById(plan._id)
      .select("imageConfig.overrides")
      .lean();
    const stored = saved?.imageConfig?.overrides || [];
    const storedForDate = stored.filter((o) => o.date === date);

    if (url && !storedForDate.some((o) => o.images?.[slot] === url)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not save that day — the server did not accept the change. Restart the app and try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, overrides: storedForDate });
  } catch (error) {
    console.error("IMAGE SCHEDULE PUT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
