// src/utils/franchiseDemoSlots.js
// Working hours 9:00 AM - 7:00 PM, 1 hour slots => 10 slots/day.
// Slot format: "09:00-10:00" ... "18:00-19:00"

export const SLOT_START_HOUR = 9;
export const SLOT_END_HOUR = 19; // last slot ends at 19:00

/** ["09:00-10:00", ..., "18:00-19:00"] */
export function getAllSlotTimes() {
  const slots = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    const from = String(h).padStart(2, "0") + ":00";
    const to = String(h + 1).padStart(2, "0") + ":00";
    slots.push(`${from}-${to}`);
  }
  return slots;
}

/** Basic YYYY-MM-DD validation. */
export function isValidDate(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/** Is the given slotTime one of the 10 valid daily slots. */
export function isValidSlotTime(slotTime) {
  return getAllSlotTimes().includes(slotTime);
}

// ---- IST (Asia/Kolkata) time helpers ----
// VPS UTC pe chalta hai, isliye current date/time hamesha IST me nikaalte hain.
const IST_TZ = "Asia/Kolkata";

/** Aaj ki date IST me "YYYY-MM-DD". */
export function istCalendarDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Abhi ka time IST me — midnight se minutes (e.g. 16:00 => 960). */
export function istNowMinutes(now = new Date()) {
  const t = now.toLocaleTimeString("en-GB", {
    timeZone: IST_TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Slot ke start ka minutes ("09:00-10:00" => 540). */
export function slotStartMinutes(slotTime) {
  const from = String(slotTime).split("-")[0];
  const [h, m] = from.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Slot past hai kya — IST ke hisaab se.
 * - guzra hua din  -> true
 * - future din     -> false
 * - aaj            -> agar slot ka start time nikal chuka hai to true
 */
export function isSlotPast(date, slotTime, now = new Date()) {
  const today = istCalendarDate(now);
  if (date < today) return true;
  if (date > today) return false;
  return slotStartMinutes(slotTime) <= istNowMinutes(now);
}
