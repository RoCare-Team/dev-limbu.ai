/**
 * GMB local post payload ko Google ke rules ke hisaab se saaf karta hai.
 *
 * "Request contains an invalid argument" (Google 400 INVALID_ARGUMENT) ke 3 aam
 * kaaran, jo ye sanitizer rok deta hai:
 *
 *   1. CTA button (LEARN_MORE / BOOK / ORDER / SHOP / SIGN_UP) ko VALID URL
 *      chahiye hi. Automation me website na hone par bookUrl khaali jaata tha →
 *      button bina URL ke → reject. Ab aise case me CTA drop kar dete hain.
 *   2. summary (description) max 1500 chars. AI text lamba ho to reject.
 *   3. URL me http(s) na ho (e.g. "example.com") → invalid URL → reject.
 */

// GMB local post summary/description ki hard limit.
const GMB_SUMMARY_MAX = 1500;

// In CTA types ko ek valid URL chahiye. CALL ko phone chahiye (URL nahi).
const URL_CTAS = new Set(["book", "order", "shop", "sign_up", "learn_more"]);

/** Trim + 1500 char cap. */
export function sanitizeGmbDescription(text) {
  const s = String(text || "").trim();
  if (s.length <= GMB_SUMMARY_MAX) return s;
  // Word boundary par kaato taaki beech shabd na tute.
  const cut = s.slice(0, GMB_SUMMARY_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > GMB_SUMMARY_MAX - 40 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * URL ko normalize karta hai: protocol na ho to https:// laga deta hai.
 * Valid http(s) URL na bane to "" lautata hai.
 */
export function sanitizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname || !u.hostname.includes(".")) return "";
    return u.toString();
  } catch {
    return "";
  }
}

/** Sirf digits (aur leading +) — GMB CALL ke phone ke liye. */
export function sanitizePhone(phone) {
  const s = String(phone || "").trim();
  if (!s) return "";
  const cleaned = s.replace(/[^\d+]/g, "");
  return cleaned.replace(/\+(?=.*\+)/g, ""); // sirf pehla + rakho
}

/**
 * Automation/default post ke liye CTA chuno.
 *
 * DEFAULT: call_now — us business location ka apna phone number use hota hai
 * (Google CALL button business ke registered number par call karta hai).
 * Phone na ho to graceful fallback: website ho to "book" (website URL), warna
 * koi button nahi. Isse post kabhi "invalid argument" se fail nahi hota.
 *
 * @returns {{ cta: string, url: string }}  url = call_now me phone, warna website
 */
export function resolveDefaultGmbCta({ phone, website }) {
  const p = sanitizePhone(phone);
  if (p) return { cta: "call_now", url: p };

  // Phone nahi → website ka "book" button.
  const w = sanitizeUrl(website);
  if (w) return { cta: "book", url: w };

  return { cta: "", url: "" }; // na phone na website → button ke bina post
}

/**
 * CTA + URL ko safe banata hai.
 *
 * @returns {{ cta: string, url: string }}
 *   - URL-required CTA + valid URL      → wahi CTA + normalized URL
 *   - URL-required CTA + koi valid URL nahi → CTA drop ("" — button ke bina post)
 *   - call_now                          → jaisa hai (URL relevant nahi)
 */
export function resolveGmbCta(ctaType, url) {
  const cta = String(ctaType || "").trim().toLowerCase();
  if (cta === "call_now") return { cta: "call_now", url: "" };

  if (URL_CTAS.has(cta)) {
    const clean = sanitizeUrl(url);
    // URL nahi mila to button hi hata do — warna Google poora post reject karta hai.
    return clean ? { cta, url: clean } : { cta: "", url: "" };
  }

  // Anjaan CTA — safe raho, URL ho to rakho.
  return { cta, url: sanitizeUrl(url) };
}
