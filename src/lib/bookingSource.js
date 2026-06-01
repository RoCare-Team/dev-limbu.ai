/** Canonical values stored on ServiceBooking.bookingSource */
export const BOOKING_SOURCE_VALUES = ["website", "chatbot", "manual-upload"]

export function normalizeBookingSource(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
  if (s === "checkout") return "website"
  if (BOOKING_SOURCE_VALUES.includes(s)) return s
  return "website"
}

/** Maps paid-booking channel → User.source (must match User schema enum). */
export function bookingSourceToUserSource(bookingSource) {
  const b = normalizeBookingSource(bookingSource)
  if (b === "chatbot") return "chatbot"
  if (b === "manual-upload") return "manual-upload"
  return "website"
}

/** Short label for ServiceBooking.bookingSource */
export function bookingSourceLabel(bookingSource) {
  const b = normalizeBookingSource(bookingSource)
  if (b === "chatbot") return "Chatbot"
  if (b === "manual-upload") return "Meta Leads"
  return "Website"
}

/** Groups legacy + new User.source for admin UI */
export function userAcquisitionLabel(source) {
  const s = String(source || "").trim()
  if (!s) return "Signup"
  if (s === "chatbot") return "Chatbot"
  if (s === "website" || s === "checkout") return "Website"
  if (
    s === "manual-upload" ||
    s === "bulk-upload" ||
    s === "csv-import" ||
    s === "excel-import" ||
    s === "Meta Lead"
  ) {
    return "Meta lead"
  }
  if (s === "signup") return "Signup"
  if (s === "Meta Leads" || s === "Meta") return "Meta lead"
  return s.replace(/-/g, " ")
}

export const USER_SOURCE_OPTIONS = [
  { value: "signup", label: "Signup" },
  { value: "website", label: "Website" },
  { value: "chatbot", label: "Chatbot" },
  { value: "Meta Lead", label: "Meta Lead" },
  { value: "manual-upload", label: "Manual Meta import" },
  { value: "bulk-upload", label: "Bulk Meta import" },
  { value: "csv-import", label: "CSV import" },
  { value: "excel-import", label: "Excel import" },
  { value: "checkout", label: "Checkout (legacy)" },
  { value: "Meta", label: "Meta (legacy)" },
]

export const ALLOWED_USER_SOURCE_VALUES = USER_SOURCE_OPTIONS.map((o) => o.value)

/** Bulk / sheet / manual Meta-style imports — tag as metaleads */
export const META_SHEET_LEAD_SOURCES = [
  "Meta Lead",
  "Meta Leads",
  "Meta",
  "bulk-upload",
  "csv-import",
  "excel-import",
  "manual-upload",
]

export function shouldTagMetaLeads(source) {
  return META_SHEET_LEAD_SOURCES.includes(String(source || "").trim())
}

/** Returns a new array including `metaleads` when source is a sheet/Meta import */
export function mergeMetaLeadsTag(source, existingLeadTags = []) {
  const base = Array.isArray(existingLeadTags) ? [...existingLeadTags] : []
  if (!shouldTagMetaLeads(source)) return base
  const s = new Set([...base, "metaleads"])
  return [...s]
}

const TAG_BASE =
  "inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border shadow-sm"

/**
 * Tailwind classes for the main acquisition pill (User.source) in admin tables.
 * Each channel has a distinct, accessible color.
 */
export function userAcquisitionTagClassName(source) {
  const s = String(source || "").trim()
  if (
    s === "manual-upload" ||
    s === "bulk-upload" ||
    s === "csv-import" ||
    s === "excel-import" ||
    s === "Meta Lead" ||
    s === "Meta Leads" ||
    s === "Meta"
  ) {
    return `${TAG_BASE} bg-violet-100 text-violet-900 border-violet-300/70`
  }
  if (s === "website" || s === "checkout") {
    return `${TAG_BASE} bg-sky-100 text-sky-900 border-sky-300/70`
  }
  if (s === "chatbot") {
    return `${TAG_BASE} bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300/70`
  }
  if (s === "signup") {
    return `${TAG_BASE} bg-emerald-100 text-emerald-900 border-emerald-300/70`
  }
  return `${TAG_BASE} bg-slate-100 text-slate-800 border-slate-300/60`
}

/** Display label for stored lead tag keys (e.g. metaleads → Meta leads) */
export function formatLeadTagLabel(tag) {
  const t = String(tag || "").trim()

  if (!t) return ""

  if (t.toLowerCase() === "metaleads") return "Meta leads"

  return t
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Tailwind classes for extra `User.leadTags` chips (distinct from source pill).
 */
export function leadTagPillClassName(tag) {
  const t = String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (t === "metaleads") {
    return "bg-indigo-50 text-indigo-900 border-indigo-300/70";
  }

  if (t === "website" || t === "web") {
    return "bg-cyan-50 text-cyan-900 border-cyan-300/70";
  }

  if (t === "priority" || t === "hot") {
    return "bg-orange-50 text-orange-900 border-orange-300/70";
  }

  // 👇 YE NAYA BLOCK ADD KARNA HAI
  if (t === "expolead") {
    return "bg-purple-100 text-purple-700 border-purple-300";
  }

  return "bg-stone-50 text-stone-800 border-stone-300/60";
}
