/** Google Business Information API v1 — TimePeriod / regularHours.periods */

export const GMB_WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABEL = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export function dayEnumToLabel(day) {
  return DAY_LABEL[day] || String(day || '');
}

function pad2(n) {
  return String(Math.max(0, Math.min(59, Number(n) || 0))).padStart(2, '0');
}

export function formatTimeOfDay(h, m) {
  const hh = Math.max(0, Math.min(24, Number(h) || 0));
  const mm = hh === 24 ? 0 : Number(m) || 0;
  return `${String(hh).padStart(2, '0')}:${pad2(mm)}`;
}

/** Human line for one day (matches in-app summary style). */
export function formatDayLine(dayEnum, state) {
  if (!state || state.mode === 'closed') return `${dayEnumToLabel(dayEnum)}: Closed`;
  if (state.mode === 'open24') return `${dayEnumToLabel(dayEnum)}: Open 24 hours`;
  if (state.mode === 'hours') {
    return `${dayEnumToLabel(dayEnum)}: ${formatTimeOfDay(state.openH, state.openM)}–${formatTimeOfDay(state.closeH, state.closeM)}`;
  }
  return `${dayEnumToLabel(dayEnum)}: —`;
}

/**
 * First matching period per weekday (split shifts collapse to first slice).
 * @param {Array<{openDay?: string, closeDay?: string, openTime?: {hours?: number, minutes?: number}, closeTime?: {hours?: number, minutes?: number}}>} periods
 */
export function parsePeriodsToDayMap(periods) {
  /** @type {Record<string, { mode: 'closed'|'open24'|'hours', openH?: number, openM?: number, closeH?: number, closeM?: number }>} */
  const map = {};
  for (const d of GMB_WEEKDAYS) {
    map[d] = { mode: 'closed' };
  }
  if (!Array.isArray(periods)) return map;
  for (const p of periods) {
    const od = p.openDay;
    if (!od || !GMB_WEEKDAYS.includes(od)) continue;
    if (map[od].mode !== 'closed') continue;
    // GMB represents midnight (00:00) as an empty TimeOfDay ({}), i.e. hours omitted.
    // So an existing period with no openTime.hours means 00:00, not "missing".
    const hasOpen = p.openTime && typeof p.openTime === 'object';
    const hasClose = p.closeTime && typeof p.closeTime === 'object';
    const oh = p.openTime?.hours ?? 0;
    const om = p.openTime?.minutes ?? 0;
    const ch = p.closeTime?.hours ?? 0;
    const cm = p.closeTime?.minutes ?? 0;
    if (ch === 24 && oh === 0 && om === 0) {
      map[od] = { mode: 'open24' };
      continue;
    }
    if (!hasOpen && !hasClose) {
      map[od] = { mode: 'closed' };
      continue;
    }
    map[od] = {
      mode: 'hours',
      openH: oh ?? 9,
      openM: om ?? 0,
      closeH: ch ?? 17,
      closeM: cm ?? 0,
    };
  }
  return map;
}

export function dayMapToPeriods(map) {
  const periods = [];
  for (const d of GMB_WEEKDAYS) {
    const s = map[d];
    if (!s || s.mode === 'closed') continue;
    if (s.mode === 'open24') {
      periods.push({
        openDay: d,
        openTime: { hours: 0, minutes: 0 },
        closeDay: d,
        closeTime: { hours: 24, minutes: 0 },
      });
    } else if (s.mode === 'hours') {
      periods.push({
        openDay: d,
        openTime: { hours: Number(s.openH) || 0, minutes: Number(s.openM) || 0 },
        closeDay: d,
        closeTime: { hours: Number(s.closeH) || 0, minutes: Number(s.closeM) || 0 },
      });
    }
  }
  return periods;
}

export function clonePeriods(periods) {
  if (!Array.isArray(periods)) return [];
  try {
    return JSON.parse(JSON.stringify(periods));
  } catch {
    return [];
  }
}
