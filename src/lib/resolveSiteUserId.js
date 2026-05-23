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
