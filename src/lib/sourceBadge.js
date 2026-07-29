/**
 * Consistent per-source colours so "manual-upload", "gmb-scraper", "website"
 * etc. are distinguishable at a glance across the franchise panel.
 */
const SOURCE_STYLES = {
  "manual-upload": "border-sky-200 bg-sky-50 text-sky-700",
  "gmb-scraper": "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  "franchise-panel": "border-violet-200 bg-violet-50 text-violet-700",
  website: "border-emerald-200 bg-emerald-50 text-emerald-700",
  chatbot: "border-cyan-200 bg-cyan-50 text-cyan-700",
  whatsapp: "border-green-200 bg-green-50 text-green-700",
  meta: "border-blue-200 bg-blue-50 text-blue-700",
  "meta leads": "border-blue-200 bg-blue-50 text-blue-700",
  "meta-leads": "border-blue-200 bg-blue-50 text-blue-700",
  "meta lead": "border-blue-200 bg-blue-50 text-blue-700",
  "meta-ads": "border-blue-200 bg-blue-50 text-blue-700",
  facebook: "border-blue-200 bg-blue-50 text-blue-700",
  "facebook-ads": "border-blue-200 bg-blue-50 text-blue-700",
  instagram: "border-pink-200 bg-pink-50 text-pink-700",
  "instagram-ads": "border-pink-200 bg-pink-50 text-pink-700",
  google: "border-amber-200 bg-amber-50 text-amber-700",
  "google-ads": "border-amber-200 bg-amber-50 text-amber-700",
  "other-platform": "border-slate-200 bg-slate-100 text-slate-700",
  referral: "border-teal-200 bg-teal-50 text-teal-700",
  signup: "border-indigo-200 bg-indigo-50 text-indigo-700",
  "bulk-upload": "border-orange-200 bg-orange-50 text-orange-700",
};

/** Deterministic fallback so unknown sources still get a stable colour. */
const FALLBACK_STYLES = [
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-purple-200 bg-purple-50 text-purple-700",
  "border-yellow-200 bg-yellow-50 text-yellow-800",
  "border-stone-200 bg-stone-100 text-stone-700",
];

const ACRONYMS = new Set(["gmb", "gst", "crm", "api", "seo", "ivr", "sms"]);

function normalize(source) {
  return String(source || "manual-upload")
    .trim()
    .toLowerCase();
}

export function sourceBadgeClass(source) {
  const key = normalize(source);
  if (SOURCE_STYLES[key]) return SOURCE_STYLES[key];

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_STYLES[hash % FALLBACK_STYLES.length];
}

/** "gmb-scraper" → "GMB Scraper" */
export function sourceLabel(source) {
  return normalize(source)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1),
    )
    .join(" ");
}
