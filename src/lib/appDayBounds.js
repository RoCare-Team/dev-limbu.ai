/**
 * Calendar "today" bounds for reporting (Meta vs signup counts, etc.).
 * Default Asia/Kolkata — matches Indian business day regardless of Vercel UTC.
 * Override with APP_TIMEZONE (IANA), e.g. "Asia/Dubai".
 */

export function getAppTimeZone() {
  return process.env.APP_TIMEZONE || "Asia/Kolkata";
}

/**
 * @param {Date} [refDate=new Date()]
 * @returns {{ start: Date, end: Date, calendarDate: string, timeZone: string, displayLabel: string }}
 */
export function getAppDayBounds(refDate = new Date()) {
  const timeZone = getAppTimeZone();
  const cal = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const ymd = cal.format(refDate);
  const now = refDate.getTime();
  const probeStart = now - 72 * 3600000;
  const probeEnd = now + 72 * 3600000;

  let dayStartMs = null;
  for (let t = probeStart; t <= probeEnd; t += 60000) {
    if (cal.format(new Date(t)) === ymd) {
      dayStartMs = t;
      break;
    }
  }

  if (dayStartMs === null) {
    const fallback = new Date(refDate);
    fallback.setHours(0, 0, 0, 0);
    const endF = new Date(fallback);
    endF.setHours(23, 59, 59, 999);
    return {
      start: fallback,
      end: endF,
      calendarDate: ymd,
      timeZone,
      displayLabel: `${ymd} (server local fallback)`,
    };
  }

  let dayEndMs = dayStartMs;
  for (let t = dayStartMs; t <= dayStartMs + 26 * 3600000; t += 1000) {
    if (cal.format(new Date(t)) !== ymd) break;
    dayEndMs = t;
  }

  const displayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(refDate);

  return {
    start: new Date(dayStartMs),
    end: new Date(dayEndMs),
    calendarDate: ymd,
    timeZone,
    displayLabel: `${displayLabel} · ${timeZone}`,
  };
}
