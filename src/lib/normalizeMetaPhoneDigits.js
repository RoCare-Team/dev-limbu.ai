/**
 * Digits-only phone (chatbot / OAuth state). Pure — safe in client bundles.
 * @param {string} phone
 */
export function normalizeMetaPhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}
