import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import SocialAutomation from "@/models/SocialAutomation";
import SocialAutomationLog from "@/models/SocialAutomationLog";
import { automationAccounts } from "@/lib/social/automationEngine";
import { getUserActivePlans, planGroupsOf } from "@/lib/userPlans";

const SECTIONS = ["commentReply", "dmReply", "moderation"];
const LOG_KINDS = {
  commentReply: ["comment_reply"],
  dmReply: ["dm_reply"],
  moderation: ["hidden", "deleted"],
};

async function hasSocialPlan(userId) {
  const user = await User.findOne({ userId }).select("userId subscription planPurchases").lean();
  return !!user && planGroupsOf(await getUserActivePlans(user)).includes("social");
}

/**
 * GET /api/social/automation?userId=&feature=commentReply|dmReply|moderation
 * Settings, connected accounts (with what their permissions allow) and the
 * latest activity for that feature.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const feature = searchParams.get("feature");
  if (!userId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  try {
    await dbConnect();
    const [settings, accounts, logs, socialPlan] = await Promise.all([
      SocialAutomation.findOne({ userId }).lean(),
      automationAccounts(userId),
      SocialAutomationLog.find({ userId, ...(LOG_KINDS[feature] ? { kind: { $in: LOG_KINDS[feature] } } : { kind: { $ne: "skipped" } }) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      hasSocialPlan(userId),
    ]);
    return NextResponse.json({
      success: true,
      socialPlan,
      settings: settings || new SocialAutomation({ userId }).toObject(),
      accounts: accounts.map(({ platform, id, name, allow }) => ({ platform, id, name, allow })),
      logs,
    });
  } catch (err) {
    console.error("social automation GET:", err);
    return NextResponse.json({ success: false, error: "Could not load your settings." }, { status: 500 });
  }
}

/**
 * PUT /api/social/automation { userId, section, data }
 * section: commentReply | dmReply | moderation | business.
 * Turning a feature on needs an active Social plan.
 */
export async function PUT(req) {
  try {
    const { userId, section, data = {} } = await req.json();
    if (!userId || (!SECTIONS.includes(section) && section !== "business")) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    await dbConnect();

    const update = {};
    if (section === "business") {
      update.businessName = String(data.businessName || "").slice(0, 120);
      update.businessInfo = String(data.businessInfo || "").slice(0, 2000);
    } else {
      if (data.enabled && !(await hasSocialPlan(userId))) {
        return NextResponse.json({ success: false, needsPlan: true, error: "Turn this on with a Social plan." }, { status: 403 });
      }
      const platforms = { facebook: data.platforms?.facebook !== false, instagram: data.platforms?.instagram !== false };
      update[section] = { enabled: !!data.enabled, platforms };
      if (section !== "moderation") update[section].tone = ["friendly", "professional", "short"].includes(data.tone) ? data.tone : "friendly";
      if (section === "moderation") {
        update.moderation.action = data.action === "delete" ? "delete" : "hide";
        update.moderation.useAi = data.useAi !== false;
        update.moderation.blockedWords = (Array.isArray(data.blockedWords) ? data.blockedWords : [])
          .map((w) => String(w).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 100);
      }
    }
    const settings = await SocialAutomation.findOneAndUpdate({ userId }, { $set: update }, { upsert: true, new: true }).lean();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("social automation PUT:", err);
    return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
  }
}
