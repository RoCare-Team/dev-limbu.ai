import { normalizePhone } from "@/lib/gmbSessionStore";

/** WhatsApp-style site owner id, e.g. `wa_91987740847114` */
export function waUserIdFromPhone(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const with91 = digits.length === 10 ? `91${digits}` : digits;
  return `wa_${with91}`;
}

/**
 * Resolve a stable Site.userId when dashboard registration is missing (chatbot / connect flow).
 * Priority: explicit userId → phone → email (lowercase).
 */
export function resolveSiteUserId({ userId, phone, email } = {}) {
  if (userId && String(userId).trim()) return String(userId).trim();
  const fromPhone = waUserIdFromPhone(phone);
  if (fromPhone) return fromPhone;
  const mail = (email || "").trim().toLowerCase();
  if (mail.includes("@")) return mail;
  return null;
}

export function isChatbotSiteOwnerId(id) {
  return typeof id === "string" && id.startsWith("wa_");
}

/** `wa_917740847114` → 10-digit Indian mobile (e.g. `7740847114`) */
export function phoneFromWaUserId(waUserId) {
  if (!waUserId || typeof waUserId !== "string") return "";
  let digits = waUserId.replace(/^wa_/i, "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits.length === 10 ? digits : "";
}

/**
 * GBP primaryPhone when missing: use profile phone, else derive from chatbot `wa_*` userId or session phone.
 */
export function resolvePrimaryPhoneForSite({ primaryPhone, phone, userId } = {}) {
  const fromGmb = String(primaryPhone || "").trim();
  if (fromGmb) return fromGmb;

  const explicitWa =
    userId && String(userId).trim().startsWith("wa_") ? String(userId).trim() : "";
  if (explicitWa) {
    const fromWa = phoneFromWaUserId(explicitWa);
    if (fromWa) return fromWa;
  }

  const waId = waUserIdFromPhone(phone);
  if (waId) {
    const fromSession = phoneFromWaUserId(waId);
    if (fromSession) return fromSession;
  }

  return "";
}
