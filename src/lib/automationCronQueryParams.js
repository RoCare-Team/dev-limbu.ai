/**
 * Shared query parsing for automation crons (/api/cron/auto-post, /api/cron/automation-plans).
 * Use URLSearchParams only — avoids mismatches where force=false but callers sent force=true.
 */

import { getHourMinuteInTimeZone } from '@/utils/postingScheduleWindow';

/** True if param is explicit boolean-ish truthy (true, 1, yes — case-insensitive). */
export function parseCronBool(searchParams, key) {
  const v = searchParams.get(key);
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

/**
 * @param {string} requestUrl - full URL string e.g. request.url
 */
export function parseAutomationCronParams(requestUrl) {
  const { searchParams } = new URL(requestUrl);
  return {
    force: parseCronBool(searchParams, 'force'),
    dryRun: parseCronBool(searchParams, 'dryRun'),
    manualTrigger: parseCronBool(searchParams, 'manualTrigger'),
    testNow: parseCronBool(searchParams, 'testNow'),
    testPostingHour: searchParams.get('testPostingHour'),
    testPostingMinute: searchParams.get('testPostingMinute'),
  };
}

/**
 * Clone plan with postingHour/postingMinute overridden for window checks only (no DB write).
 * testNow=true → use current clock in plan TZ so publish/prefetch windows match "now".
 * Optional testPostingHour & testPostingMinute query overrides when both present.
 */
export function effectivePlanForPostingClock(plan, params, runNow = new Date()) {
  const tz = plan.postingTimezone || 'Asia/Kolkata';
  let postingHour = plan.postingHour;
  let postingMinute = Number(plan.postingMinute) || 0;
  let clockOverrideReason = null;

  if (params.testNow) {
    const hm = getHourMinuteInTimeZone(runNow, tz);
    postingHour = hm.hour;
    postingMinute = hm.minute;
    clockOverrideReason = `testNow=true → ${postingHour}:${String(postingMinute).padStart(2, '0')} (${tz})`;
  } else if (
    params.testPostingHour !== null &&
    params.testPostingHour !== '' &&
    params.testPostingMinute !== null &&
    params.testPostingMinute !== ''
  ) {
    postingHour = Number(params.testPostingHour);
    postingMinute = Number(params.testPostingMinute);
    if (!Number.isFinite(postingHour)) postingHour = plan.postingHour;
    if (!Number.isFinite(postingMinute)) postingMinute = plan.postingMinute ?? 0;
    clockOverrideReason = `testPostingHour=${params.testPostingHour} testPostingMinute=${params.testPostingMinute} (${tz})`;
  }

  return {
    ...plan,
    postingHour,
    postingMinute,
    _clockOverrideReason: clockOverrideReason,
  };
}
