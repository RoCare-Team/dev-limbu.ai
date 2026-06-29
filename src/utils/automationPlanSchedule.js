/**
 * Next publish date + posting-day checks for automation cron.
 * Uses the plan's postingTimezone (default Asia/Kolkata) for calendar days.
 */

import { zonedYmdString, getUtcInstantForZonedDateAndTime } from '@/utils/postingScheduleWindow';
import { getFrequencyStep } from '@/utils/userSettingsHelpers';

/** True when the plan generates assets ~24h before each publish (offset ≥ 1440). */
export function usesPrefetchLeadDay(plan) {
  return Number(plan?.prefetchOffsetMinutes) >= 1440;
}

function shouldSkipPublishYmdForPrefetchLead(/* plan, ymd, tz */) {
  // Previously the start day was treated as "prefetch-only" (generate assets,
  // publish next day). That left a brand-new plan doing nothing on the day it
  // was saved — looked like "auto post generate nahi hota". The publish cron
  // already generates image + copy inline when no prefetch bundle exists, so we
  // now allow the start day to publish too. The 24h prefetch still applies to
  // every following day (after the first post, nextRef advances to D+1 whose
  // prefetch window lands on the start day's posting time).
  return false;
}

export function sameZonedDay(a, b, timeZone) {
  if (!a || !b) return false;
  return zonedYmdString(a, timeZone) === zonedYmdString(b, timeZone);
}

/** @returns {boolean|null} true/false, or null = "no schedule array — use frequency fallback" */
export function isTodayScheduledPostingDay(plan, now = new Date()) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const schedule = plan.schedule || [];
  if (!schedule.length) return null;

  const todayYmd = zonedYmdString(now, tz);
  const startYmd = plan.startDate ? zonedYmdString(plan.startDate, tz) : null;
  const endYmd = plan.endDate ? zonedYmdString(plan.endDate, tz) : null;
  if (startYmd && todayYmd < startYmd) return false;
  if (endYmd && todayYmd > endYmd) return false;

  const skipped = new Set(Array.isArray(plan.skippedDates) ? plan.skippedDates : []);
  if (skipped.has(todayYmd)) return false;

  return schedule.some((sd) => zonedYmdString(sd, tz) === todayYmd);
}

/**
 * Next calendar day in TZ when a post should go out (for prefetch targeting).
 * Schedule: first slot after last post (or first from today if never posted).
 * No schedule: walk calendar days with frequency gap from lastPostDate / startDate.
 */
export function getNextPublishDateRef(plan, now = new Date()) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const schedule = plan.schedule || [];
  const todayYmd = zonedYmdString(now, tz);
  const rawLastYmd = plan.lastPostDate ? zonedYmdString(plan.lastPostDate, tz) : null;
  const startYmd = plan.startDate ? zonedYmdString(plan.startDate, tz) : null;
  // Ignore lastPostDate if it predates automation startDate (stale / migrated rows)
  const lastYmd =
    rawLastYmd && startYmd && rawLastYmd < startYmd ? null : rawLastYmd;
  const endYmd = plan.endDate ? zonedYmdString(plan.endDate, tz) : null;
  const skipped = new Set(Array.isArray(plan.skippedDates) ? plan.skippedDates : []);

  if (schedule.length > 0) {
    const rows = [];
    for (const raw of schedule) {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const ymd = zonedYmdString(d, tz);
      rows.push({ ymd, d });
    }
    rows.sort((a, b) => a.ymd.localeCompare(b.ymd));
    if (!lastYmd) {
      for (const { ymd, d } of rows) {
        if (ymd < todayYmd) continue;
        if (startYmd && ymd < startYmd) continue;
        if (endYmd && ymd > endYmd) continue;
        if (skipped.has(ymd)) continue;
        return d;
      }
    } else {
      for (const { ymd, d } of rows) {
        if (ymd <= lastYmd) continue;
        if (endYmd && ymd > endYmd) continue;
        if (skipped.has(ymd)) continue;
        return d;
      }
    }
    return null;
  }

  const step = getFrequencyStep(plan.frequency || 'daily');

  for (let add = 0; add < 500; add++) {
    const probe = new Date(now.getTime() + add * 86400000);
    const ymd = zonedYmdString(probe, tz);
    if (ymd < todayYmd) continue;
    if (startYmd && ymd < startYmd) continue;
    if (endYmd && ymd > endYmd) continue;
    if (skipped.has(ymd)) continue;

    if (!lastYmd) {
      if (shouldSkipPublishYmdForPrefetchLead(plan, ymd, tz)) continue;
      return probe;
    }
    if (daysBetweenYmd(lastYmd, ymd) >= step) {
      if (shouldSkipPublishYmdForPrefetchLead(plan, ymd, tz)) continue;
      return probe;
    }
  }
  return null;
}

function daysBetweenYmd(ymdA, ymdB) {
  const a = new Date(`${ymdA}T12:00:00Z`).getTime();
  const b = new Date(`${ymdB}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

export function getPublishUtcMsForDateRef(plan, publishDateRef) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const ph = plan.postingHour;
  if (ph == null || ph === '' || Number.isNaN(Number(ph))) {
    return null;
  }
  const h = Number(ph);
  const m = Number(plan.postingMinute);
  const minute = Number.isNaN(m) ? 0 : m;
  return getUtcInstantForZonedDateAndTime(publishDateRef, h, minute, tz);
}

/** True if today (in plan TZ) is a day that should publish per schedule or frequency. */
export function isPostingDayTodayZoned(plan, now = new Date()) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  const scheduled = isTodayScheduledPostingDay(plan, now);
  if (scheduled === true) return true;
  if (scheduled === false) return false;

  const todayYmd = zonedYmdString(now, tz);
  const startYmd = plan.startDate ? zonedYmdString(plan.startDate, tz) : null;
  const endYmd = plan.endDate ? zonedYmdString(plan.endDate, tz) : null;
  if (startYmd && todayYmd < startYmd) return false;
  if (endYmd && todayYmd > endYmd) return false;

  const skipped = new Set(Array.isArray(plan.skippedDates) ? plan.skippedDates : []);
  if (skipped.has(todayYmd)) return false;

  // The start day is now a normal posting day. If no prefetch bundle exists yet
  // (it can't on day 0), the publish cron generates image + copy inline.

  const rawLastYmd = plan.lastPostDate ? zonedYmdString(plan.lastPostDate, tz) : null;
  const lastYmdStale = !!(rawLastYmd && startYmd && rawLastYmd < startYmd);

  if (!plan.lastPostDate || lastYmdStale) {
    return !startYmd || todayYmd >= startYmd;
  }

  const lastYmd = zonedYmdString(plan.lastPostDate, tz);
  const step = getFrequencyStep(plan.frequency || 'daily');
  const gap = daysBetweenYmd(lastYmd, todayYmd);
  return gap >= step;
}

/** Publish instant for today when postingHour is set and today is a posting day. */
export function getTodayPublishUtcMsIfPostingDay(plan, now = new Date()) {
  if (!isPostingDayTodayZoned(plan, now)) return null;
  return getPublishUtcMsForDateRef(plan, now);
}
