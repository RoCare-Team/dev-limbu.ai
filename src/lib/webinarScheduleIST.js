/**
 * Weekly demo webinar slots in Asia/Kolkata (Mon–Sat, no Sunday).
 * Mon–Thu & Sat: 4:00 PM · Friday: 5:30 PM (matches admin Tata Dialer convention).
 * Cut-off 3:30 PM IST: register before → same eligible day’s session; after → next session day.
 */

const TZ = "Asia/Kolkata";
const CUTOFF_HOUR = 15;
const CUTOFF_MINUTE = 30;

const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function istCalendarClock(d) {
  const dateStr = d.toLocaleDateString("en-CA", { timeZone: TZ });
  const [y, mo, day] = dateStr.split("-").map(Number);
  const timeStr = d.toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [h, mi] = timeStr.split(":").map(Number);
  const wdShort = d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" });
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y, mo: mo - 1, day, h, mi, wd: map[wdShort] };
}

/** IST wall time as UTC Date (India has no DST). */
export function istWallTimeToUtc(y, monthIndex, day, hour, minute) {
  return new Date(Date.UTC(y, monthIndex, day, hour - 5, minute - 30, 0));
}

function webinarHourMinute(wd) {
  if (wd === WD.Sun) return null;
  if (wd === WD.Fri) return [17, 30];
  return [16, 0];
}

function addDaysCalendar(y, mo, day, delta) {
  const noonUtc = istWallTimeToUtc(y, mo, day, 12, 0);
  return new Date(noonUtc.getTime() + delta * 86400000);
}

/**
 * @returns {{ sessionUtc: Date, reminderUtc: Date, sessionLabel: string }}
 */
export function computeWebinarAssignment(registrationDate = new Date()) {
  const reg = registrationDate;
  let { y, mo, day, h, mi, wd } = istCalendarClock(reg);

  const beforeCutoff =
    h < CUTOFF_HOUR || (h === CUTOFF_HOUR && mi < CUTOFF_MINUTE);

  let cy = y;
  let cm = mo;
  let cd = day;
  let cwd = wd;

  if (cwd === WD.Sun) {
    const d = addDaysCalendar(cy, cm, cd, 1);
    const p = istCalendarClock(d);
    cy = p.y;
    cm = p.mo;
    cd = p.day;
    cwd = p.wd;
  }

  if (!beforeCutoff) {
    const d = addDaysCalendar(cy, cm, cd, 1);
    const p = istCalendarClock(d);
    cy = p.y;
    cm = p.mo;
    cd = p.day;
    cwd = p.wd;
    while (cwd === WD.Sun) {
      const d2 = addDaysCalendar(cy, cm, cd, 1);
      const p2 = istCalendarClock(d2);
      cy = p2.y;
      cm = p2.mo;
      cd = p2.day;
      cwd = p2.wd;
    }
  }

  for (let attempt = 0; attempt < 21; attempt++) {
    if (cwd === WD.Sun) {
      const d = addDaysCalendar(cy, cm, cd, 1);
      const p = istCalendarClock(d);
      cy = p.y;
      cm = p.mo;
      cd = p.day;
      cwd = p.wd;
      continue;
    }

    const hm = webinarHourMinute(cwd);
    if (!hm) break;
    const sessionUtc = istWallTimeToUtc(cy, cm, cd, hm[0], hm[1]);

    if (sessionUtc.getTime() > reg.getTime()) {
      const reminderUtc = new Date(sessionUtc.getTime() - 15 * 60 * 1000);
      const sessionLabel = new Intl.DateTimeFormat("en-IN", {
        timeZone: TZ,
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(sessionUtc);
      return { sessionUtc, reminderUtc, sessionLabel };
    }

    const d = addDaysCalendar(cy, cm, cd, 1);
    const p = istCalendarClock(d);
    cy = p.y;
    cm = p.mo;
    cd = p.day;
    cwd = p.wd;
  }

  throw new Error("webinarSchedule: could not assign a session");
}
