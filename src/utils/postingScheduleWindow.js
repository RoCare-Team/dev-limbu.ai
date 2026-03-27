/**
 * Posting window helpers — automation runs at a user-chosen local time (e.g. 11:00 Asia/Kolkata).
 * Prefetch runs in the same cron pass after publish, ~24h before the next publish.
 */

export function getHourMinuteInTimeZone(date, timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone || 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return { hour, minute };
}

/**
 * If plan.postingHour is null/undefined → always true (backward compatible).
 * Otherwise true when current local time is within tolerance of postingHour:postingMinute.
 */
export function matchesPostingWindow(plan, date = new Date(), toleranceMinutes = 90) {
  const h = plan?.postingHour;
  if (h == null || h === '') return true;

  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const targetMin = (Number(h) || 0) * 60 + (Number(plan.postingMinute) || 0);
  const { hour, minute } = getHourMinuteInTimeZone(date, tz);
  const nowMin = hour * 60 + minute;

  let diff = Math.abs(nowMin - targetMin);
  if (diff > 720) diff = 1440 - diff; // cross-midnight wrap

  return diff <= toleranceMinutes;
}
