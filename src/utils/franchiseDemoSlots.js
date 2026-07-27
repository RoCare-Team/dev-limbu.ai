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
