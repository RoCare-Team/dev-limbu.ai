/**
 * Reads the calling user from the users collection for GET /api/home-sections.
 * Only this file knows the shape of the user document.
 */
import User from "@/models/User";
import { getUserActivePlans } from "@/lib/userPlans";

/** Keeps the last 10 digits, so "+91 98912 34890" and "9891234890" match. */
export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

/**
 * Finds the user by userId first (what every other app API sends), then by
 * mobile number. Returns a plain object with `activePlans` attached, or null
 * (guest / unknown user).
 */
export async function findUser({ userId, phone }) {
  const user = await findUserDoc({ userId, phone });
  if (!user) return null;
  return { ...user, activePlans: await getUserActivePlans(user) };
}

async function findUserDoc({ userId, phone }) {
  const fields = "userId phone subscription freeUsedCount freeUsage";

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
 * Lower-cased names of the user's active, unexpired plans — worked out by
 * findUser (see lib/userPlans.js). "Free" is never a plan.
 */
export function getActivePlans(user) {
  return user?.activePlans || [];
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
