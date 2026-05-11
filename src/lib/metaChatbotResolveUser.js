import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

/**
 * Digits-only phone (same idea as GMB chatbot links).
 * @param {string} phone
 */
export function normalizeMetaPhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * Resolve dashboard Meta userId (User.userId) from WhatsApp / chatbot phone.
 * Tries full digits and common IN variants (10-digit vs 91 prefix).
 * @param {string} phone
 * @returns {Promise<string|null>}
 */
export async function resolveDashboardUserIdByPhone(phone) {
  const digits = normalizeMetaPhoneDigits(phone);
  if (!digits) return null;

  await dbConnect();

  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const variants = new Set([digits, last10]);
  if (last10.length === 10) {
    variants.add(`91${last10}`);
    variants.add(`+91${last10}`);
  }

  const user = await User.findOne({
    phone: { $in: [...variants] },
  })
    .select("userId")
    .lean();

  return user?.userId || null;
}
