/**
 * Reads the calling user from the users collection for GET /api/home-sections.
 * Only this file knows the shape of the user document.
 */
import User from "@/models/User";

/** Keeps the last 10 digits, so "+91 98912 34890" and "9891234890" match. */
export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

/**
 * Finds the user by userId first (what every other app API sends), then by
 * mobile number. Returns a plain object or null (guest / unknown user).
 */
export async function findUser({ userId, phone }) {
  const fields =
    "userId phone subscription freeUsedCount freeUsage wallet paidPackage packageExpiryDate";

  if (userId) {
    const byId = await User.findOne({ userId: String(userId).trim() })
      .select(fields)
      .lean();
    if (byId) return byId;
  }

  const ten = normalizePhone(phone);
  if (ten) {
    return User.findOne({
      phone: { $in: [ten, `91${ten}`, `+91${ten}`, `0${ten}`] },
    })
      .select(fields)
      .lean();
  }

  return null;
}

/**
 * One spelling for a plan name, so a tile listing "Basic Plan" also matches a
 * user whose subscription just says "Basic" — 167 live users are in exactly
 * that state and were being shown locked tiles they had paid for.
 */
export function normalizePlanName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*plans?$/, "");
}

/** Plan names that are not a subscription at all. */
const NON_PLAN_NAMES = new Set(["", "free", "walletrecharge", "wallet recharge"]);

/**
 * Names of the plans the user currently has, normalised.
 *
 * Two sources, because a plan can be sold either way:
 *  - `paidPackage` + `packageExpiryDate`, written by the website/admin panel.
 *  - `subscription`, written by in-app purchases. A past expiry does not count;
 *    a missing one does, since older records never stored it. "WalletRecharge"
 *    is a top-up, not a plan.
 */
export function getActivePlans(user) {
  if (!user) return [];

  const now = Date.now();
  const names = new Set();

  const pkg = normalizePlanName(user.paidPackage);
  const pkgExpiry = user.packageExpiryDate
    ? new Date(user.packageExpiryDate).getTime()
    : 0;
  if (pkg && !NON_PLAN_NAMES.has(pkg) && pkgExpiry > now) names.add(pkg);

  const sub = user.subscription || {};
  const subPlan = normalizePlanName(sub.plan);
  const subExpiry = sub.expiry ? new Date(sub.expiry).getTime() : null;
  if (
    sub.status === "active" &&
    subPlan &&
    !NON_PLAN_NAMES.has(subPlan) &&
    (subExpiry === null || subExpiry > now)
  ) {
    names.add(subPlan);
  }

  return [...names];
}

/**
 * How many free uses of this tile the user has consumed: a per-feature counter
 * (user.freeUsage[itemKey]) when present, otherwise user.freeUsedCount.
 */
export function getFreeUsed(user, itemKey) {
  if (!user) return 0;
  const perFeature = user.freeUsage && user.freeUsage[itemKey];
  if (Number.isFinite(perFeature)) return perFeature;
  return Number(user.freeUsedCount) || 0;
}
