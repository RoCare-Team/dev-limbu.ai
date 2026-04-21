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
  if (b === "manual-upload") return "Manual upload"
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
    s === "excel-import"
  ) {
    return "Manual upload"
  }
  if (s === "signup") return "Signup"
  if (s === "Meta Leads" || s === "Meta") return "Meta leads"
  return s.replace(/-/g, " ")
}

export const USER_SOURCE_OPTIONS = [
  { value: "signup", label: "Signup" },
  { value: "website", label: "Website" },
  { value: "chatbot", label: "Chatbot" },
  { value: "manual-upload", label: "Manual upload" },
  { value: "bulk-upload", label: "Bulk / sheet import" },
  { value: "csv-import", label: "CSV import" },
  { value: "excel-import", label: "Excel import" },
  { value: "checkout", label: "Checkout (legacy)" },
  { value: "Meta Leads", label: "Meta leads" },
  { value: "Meta", label: "Meta (legacy)" },
]

export const ALLOWED_USER_SOURCE_VALUES = USER_SOURCE_OPTIONS.map((o) => o.value)
