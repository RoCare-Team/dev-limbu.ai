// src/utils/whatsappLink.js
// Business phone → wa.me link (website builder ke saare WhatsApp buttons).
//
// GMB se aaye numbers aksar local format me hote hain — "09987183886",
// "022-2781 2345", "+91 99871 83886". Sirf digits strip karke wa.me/09987183886
// banane par WhatsApp error deta hai:
//   "Couldn't look up phone number 09987183886 because it's either missing a
//    country code or has the wrong one."
// Isliye link kabhi inline mat banao — hamesha yahin se.

const DEFAULT_COUNTRY_CODE = "91";

/**
 * Raw phone → wa.me ke liye E.164 digits (bina "+").
 * "09987183886" → "919987183886", "+91 99871 83886" → "919987183886".
 * Number dial-able na ho to "".
 */
export function toWhatsAppDigits(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  // Leading 0 (STD prefix) aur 00 (international prefix) dono hat jaate hain.
  const local = digits.replace(/^0+/, "");
  if (local.length < 10) return ""; // itna chhota number dial nahi ho sakta

  // Exactly 10 digits = country code missing hai → default laga do. Isse lamba
  // matlab country code pehle se hai (91…, 1…, 44…) — usse chhedna nahi hai.
  return local.length === 10 ? `${countryCode}${local}` : local;
}

/**
 * wa.me link. Phone invalid ho to "#" — anchor dead rehta hai, galat chat nahi khulti.
 * `text` plain text do (newlines bhi), encoding yahan hoti hai.
 */
export function getWhatsAppLink(phone, { text = "", countryCode } = {}) {
  const digits = toWhatsAppDigits(phone, countryCode);
  if (!digits) return "#";
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Pehle se bane wa.me link me prefilled text jodo — separator ("?" ya "&") khud
 * chunta hai. Wahan use karo jahan link prop ban kar aata hai.
 */
export function appendWhatsAppText(whatsappUrl, text) {
  if (!whatsappUrl || whatsappUrl === "#") return "#";
  const sep = whatsappUrl.includes("?") ? "&" : "?";
  return `${whatsappUrl}${sep}text=${encodeURIComponent(text)}`;
}
