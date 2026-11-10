/**
 * Which plans a user has right now, and which feature groups they unlock.
 * Server-only (reads FranchiseRevenue). One source of truth for the
 * home-sections API, the dashboard sidebar and plan-gated pages.
 *
 * A plan counts when it is active and not expired, from either place it is stored:
 *   - user.subscription            (single plan bought on the website)
 *   - FranchiseRevenue records      (plans added by franchise / admin, can be several)
 */
import FranchiseRevenue from "@/models/FranchiseRevenue";

// Feature groups a plan unlocks. Names are matched lower-cased, "plan" suffix optional.
export const PLAN_GROUPS = {
  gmb: ["gmb plan", "basic plan", "professional plan", "premium plan", "standard plan"],
  social: ["social starter", "social growth", "social pro"],
};

/** "Basic" / "basic plan " / "Basic Plan" -> "basic plan". */
export function normalizePlanName(name) {
  const n = String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!n || n === "free") return "";
  if (["basic", "professional", "premium", "standard"].includes(n)) return `${n} plan`;
  return n;
}

const notExpired = (date, now) => !date || new Date(date) >= now;

/** Lower-cased names of the user's active, unexpired plans (no duplicates). */
export async function getUserActivePlans(user) {
  if (!user) return [];
  const now = new Date();
  const plans = new Set();

  const sub = user.subscription || {};
  if (sub.status === "active" && notExpired(sub.expiry, now)) {
    const name = normalizePlanName(sub.plan);
    if (name) plans.add(name);
  }

  const records = await FranchiseRevenue.find({
    leadId: user.userId,
    type: { $in: ["plan", "user_onboard"] },
    status: { $in: ["active", "user_onboard"] },
    packageExpiryDate: { $gte: now },
  })
    .select("plan")
    .lean();
  for (const r of records) {
    const name = normalizePlanName(r.plan);
    if (name) plans.add(name);
  }

  return [...plans];
}

/** Feature groups unlocked by these plan names, e.g. ["gmb"] or ["gmb", "social"]. */
export function planGroupsOf(plans) {
  return Object.keys(PLAN_GROUPS).filter((group) =>
    plans.some((p) => PLAN_GROUPS[group].includes(p))
  );
}
