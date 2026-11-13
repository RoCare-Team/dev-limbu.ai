/**
 * Wallet top-up from the home page "Create AI Video" section, by mobile number
 * (no login). Shared by /api/wallet/{lookup,order,verify} and the
 * WalletTopup component. Coins are credited 1:1 with the rupee amount, the
 * same as /wallet (app/api/subscribe/verify).
 */

export const TOPUP_GST_RATE = 0.18;
export const TOPUP_MIN = 200;
export const TOPUP_MAX = 100000;
export const TOPUP_PRESETS = [200, 500, 1000, 2000, 5000];

export const isIndianMobile = (phone) => /^[6-9]\d{9}$/.test(String(phone || ""));

/** Last 10 digits of whatever the user typed ("+91 77408 47114" -> "7740847114"). */
export const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(-10);

/** Amount in whole rupees, or null when outside the allowed range. */
export function validTopupAmount(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= TOPUP_MIN && n <= TOPUP_MAX ? n : null;
}

/** { amount, gst, total } in rupees; GST rounded to the paisa. */
export function topupPricing(amount) {
  const gst = Math.round(amount * TOPUP_GST_RATE * 100) / 100;
  return { amount, gst, total: Math.round((amount + gst) * 100) / 100 };
}

/** Phone formats stored in the users collection over time. */
export const phoneVariants = (phone) => [phone, `+91${phone}`, `91${phone}`, `+91 ${phone}`];

/** "Robin Khan" -> "Ro*** K***": enough to recognise your own account, not to identify someone else's. */
export function maskName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts
    .slice(0, 2)
    .map((p, i) => (i === 0 ? p.slice(0, 2) : p.slice(0, 1)) + "***")
    .join(" ");
}
