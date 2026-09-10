/**
 * Webinar invite template ke shared bits.
 *
 * Do jagah use hota hai:
 *   - /api/admin/user-management-template-whatsapp  (leads → single send)
 *   - /api/franchise-leads/send-webinar-template    (franchise leads → bulk send)
 *
 * Template ke variables:
 *   {{1}} → customer ka naam
 *   {{2}} → webinar date & time (admin har send se pehle choose karta hai)
 *   {{3}} → webinar join link
 */

/**
 * Zoom join link (user-management leads) — env se override kar sakte hain.
 *
 * Ye TEENO user-management templates me jaata hai: Business Growth Workshop,
 * Subscription Reminder (Hindi), aur Webinar Invite. Naya webinar hone par sirf
 * yahi ek jagah badalni hoti hai.
 *
 * Franchise leads ka apna alag link hai (neeche) — wo isse nahi badalta.
 */
export const WEBINAR_JOIN_LINK =
  process.env.WEBINAR_JOIN_LINK ||
  "https://us06web.zoom.us/webinar/register/WN_25C3HlkaSq2GBhwyxvW73w";

/** Franchise leads ka apna alag webinar registration link. */
export const FRANCHISE_WEBINAR_JOIN_LINK =
  process.env.FRANCHISE_WEBINAR_JOIN_LINK ||
  "https://us06web.zoom.us/webinar/register/WN_DpR04OU1ReO8ZA8if__fEg";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Admin ke datetime-local input ("2026-08-20T16:00") ko padhne laayak label
 * banata hai → "20 Aug 2026, 04:00 PM".
 *
 * String ko as-is IST wall-clock maana jaata hai (koi timezone shift nahi),
 * kyunki datetime-local me timezone hota hi nahi.
 */
export function formatWebinarDateTime(value) {
  const m = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
  );
  if (!m) return String(value || "").trim();

  const [, year, month, day, hourStr, minute] = m;
  const hour24 = parseInt(hourStr, 10);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${day} ${MONTHS[parseInt(month, 10) - 1]} ${year}, ${String(
    hour12,
  ).padStart(2, "0")}:${minute} ${suffix}`;
}
