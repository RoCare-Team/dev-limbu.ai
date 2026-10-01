import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import AutomationPlan from "@/models/AutomationPlan";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";
const PAGE_SIZE = 25;
const MAX_MATCHED_USERS = 1000;

/** superAdmin only — this controls automation for every user on the platform. */
function requireSuperAdmin(req) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    if (decoded?.role !== "superAdmin") {
      return NextResponse.json({ success: false, error: "superAdmin only" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The crons publish only when BOTH flags are true (see api/cron/auto-post and
// automation-fill-queue), so those two decide what a plan's state really is.
const STATUS_QUERY = {
  running: { active: true, automationEnabled: true },
  paused: { automationEnabled: false },
  inactive: { active: false },
};

function rowFromPlan(plan, user) {
  return {
    id: String(plan._id),
    userId: plan.userId,
    user: user
      ? { fullName: user.fullName || "", email: user.email || "", phone: user.phone || "" }
      : null,
    active: !!plan.active,
    automationEnabled: !!plan.automationEnabled,
    running: !!plan.active && !!plan.automationEnabled,
    frequency: plan.frequency || "",
    platforms: Array.isArray(plan.platforms) ? plan.platforms : [],
    keywordCount: Array.isArray(plan.keywords) ? plan.keywords.length : 0,
    postingHour: typeof plan.postingHour === "number" ? plan.postingHour : null,
    postingMinute: typeof plan.postingMinute === "number" ? plan.postingMinute : 0,
    postingTimezone: plan.postingTimezone || "Asia/Kolkata",
    startDate: plan.startDate || null,
    endDate: plan.endDate || null,
    lastPostDate: plan.lastPostDate || null,
    postIndex: plan.postIndex || 0,
    scheduleCount: Array.isArray(plan.schedule) ? plan.schedule.length : 0,
    packageName: plan.planDetails?.package || "",
    postsUsed: plan.planDetails?.postsUsed ?? null,
    postsLimit: plan.planDetails?.limit ?? null,
    expiryDate: plan.planDetails?.expiryDate || null,
    updatedAt: plan.updatedAt || null,
  };
}

// -----------------------------
// LIST PLANS (GET)
// ?status=all|running|paused|inactive &search= &page=
// -----------------------------
export async function GET(req) {
  const denied = requireSuperAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const query = { ...(STATUS_QUERY[status] || {}) };

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      // The plan itself only stores userId, so a name/email/phone search has to
      // resolve to user ids first.
      const users = await User.find({
        $or: [{ fullName: rx }, { email: rx }, { phone: rx }, { userId: rx }],
      })
        .select("userId")
        .limit(MAX_MATCHED_USERS)
        .lean();
      const ids = users.map((u) => u.userId).filter(Boolean);
      query.userId = { $in: [...new Set([...ids, search])] };
    }

    const [plans, total, counts] = await Promise.all([
      AutomationPlan.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      AutomationPlan.countDocuments(query),
      Promise.all([
        AutomationPlan.countDocuments({}),
        AutomationPlan.countDocuments(STATUS_QUERY.running),
        AutomationPlan.countDocuments(STATUS_QUERY.paused),
        AutomationPlan.countDocuments(STATUS_QUERY.inactive),
      ]),
    ]);

    const userIds = [...new Set(plans.map((p) => p.userId).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ userId: { $in: userIds } }).select("userId fullName email phone").lean()
      : [];
    const userMap = new Map(users.map((u) => [u.userId, u]));

    return NextResponse.json({
      success: true,
      data: plans.map((p) => rowFromPlan(p, userMap.get(p.userId))),
      counts: { all: counts[0], running: counts[1], paused: counts[2], inactive: counts[3] },
      total,
      page,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (err) {
    console.error("ADMIN AUTOMATION PLANS LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// START / STOP A PLAN (PATCH)
// { id, action: "pause" | "resume" }
// -----------------------------
export async function PATCH(req) {
  const denied = requireSuperAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const { id, action } = await req.json();

    if (!id || !["pause", "resume"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "id and action ('pause' | 'resume') are required." },
        { status: 400 }
      );
    }

    // Pause flips the switch the crons read; everything else about the plan —
    // keywords, schedule, dates — is left untouched so resuming restores it.
    const update =
      action === "pause"
        ? { automationEnabled: false }
        : { automationEnabled: true, active: true };

    const plan = await AutomationPlan.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }

    const user = await User.findOne({ userId: plan.userId })
      .select("userId fullName email phone")
      .lean();

    return NextResponse.json({ success: true, data: rowFromPlan(plan, user) });
  } catch (err) {
    console.error("ADMIN AUTOMATION PLAN UPDATE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// DELETE A PLAN (DELETE) — ?id=
// Removes the automation plan document. The user's posts and wallet are not
// touched; the user can create a new plan by saving /user-settings again.
// -----------------------------
export async function DELETE(req) {
  const denied = requireSuperAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }

    const plan = await AutomationPlan.findByIdAndDelete(id).lean();
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, userId: plan.userId } });
  } catch (err) {
    console.error("ADMIN AUTOMATION PLAN DELETE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
