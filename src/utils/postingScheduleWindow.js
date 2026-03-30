/**
 * Posting window helpers — automation runs at a user-chosen local time (e.g. 19:10 Asia/Kolkata).
 * Prefetch runs prefetchOffsetMinutes before publish (default 1440 = same clock time previous calendar day).
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

export function zonedYmdString(date, timeZone = 'Asia/Kolkata') {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * UTC ms for one instant on dateRef's calendar day in `timeZone` at hour:minute local.
 * Walks minute-by-minute in a ±36h window (no DST issues for Asia/Kolkata).
 */
export function getUtcInstantForZonedDateAndTime(dateRef, hour, minute, timeZone = 'Asia/Kolkata') {
  const ymd = zonedYmdString(dateRef, timeZone);
  if (!ymd) return null;
  const [y, mo, d] = ymd.split('-').map(Number);
  let t = Date.UTC(y, mo - 1, d, 0, 0, 0) - 12 * 3600000;
  const end = Date.UTC(y, mo - 1, d, 0, 0, 0) + 36 * 3600000;
  const target = (Number(hour) || 0) * 60 + (Number(minute) || 0);
  let best = null;
  let bestDiff = Infinity;
  while (t < end) {
    const inst = new Date(t);
    if (zonedYmdString(inst, timeZone) === ymd) {
      const { hour: h, minute: m } = getHourMinuteInTimeZone(inst, timeZone);
      const hm = h * 60 + m;
      let diff = Math.abs(hm - target);
      if (diff > 720) diff = 1440 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = t;
      }
    }
    t += 60000;
  }
  return best == null ? null : best;
}

export function matchesAbsoluteWindow(now, targetUtcMs, toleranceMinutes = 15) {
  if (targetUtcMs == null || Number.isNaN(targetUtcMs)) return false;
  return Math.abs(now.getTime() - targetUtcMs) <= toleranceMinutes * 60 * 1000;
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
  if (diff > 720) diff = 1440 - diff;

  return diff <= toleranceMinutes;
}

/**
 * True when `now` is within tolerance of (publish instant − prefetchOffsetMinutes).
 * publishDateRef: calendar anchor for the next GMB publish (any Date on that local day).
 */
export function matchesPrefetchAbsoluteWindow(plan, publishDateRef, now = new Date(), toleranceMinutes = 15) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const h = plan.postingHour;
  if (h == null || h === '' || publishDateRef == null) return false;

  const offsetMin = Math.max(1, Number(plan.prefetchOffsetMinutes) || 1440);
  const publishMs = getUtcInstantForZonedDateAndTime(
    publishDateRef,
    Number(h) || 0,
    Number(plan.postingMinute) || 0,
    tz
  );
  if (publishMs == null) return false;
  const prefetchMs = publishMs - offsetMin * 60 * 1000;
  return matchesAbsoluteWindow(now, prefetchMs, toleranceMinutes);
}
