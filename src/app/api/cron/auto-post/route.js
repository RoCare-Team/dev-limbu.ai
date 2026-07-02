/**
 * GET /api/cron/auto-post
 *
 * Prefetch-only cron: generates image + caption and stores them on AutomationPlan.prefetchPost
 * for the *next* publish day. /api/cron/automation-plans (publish phase) reads that bundle and
 * posts to GMB, Facebook, and Instagram.
 *
 * Scheduling: `matchesPrefetchAbsoluteWindow` is true when `now` is within tolerance of
 * (publish local time − prefetchOffsetMinutes). Default offset is 1440 (24h) — e.g. post at 11:00 IST
 * tomorrow → run this route ~11:00 IST today. Use a frequent cron (e.g. every 10–50 min) or a host
 * cron aligned to that window; a single daily hit at the wrong UTC time will skip all plans.
 *
 * Query:
 *   ?force=true | force=1 — bypass prefetch time-window checks (same semantics as automation-plans).
 *   ?manualTrigger=true — logged only on this route (prefetch has no manual phase).
 *   ?testNow=true — bypass prefetch window without touching DB (uses live clock semantics on publish cron).
 *       Here: combined with logic below, testNow also bypasses prefetch window so you can run a prefetch smoke test anytime.
 *
 * Auth: if CRON_SECRET is set, require Authorization: Bearer <CRON_SECRET> (same as before).
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import AutomationPlan from '@/models/AutomationPlan';
import { getPlanPostLimit } from '@/utils/userSettingsHelpers';
import { matchesPrefetchAbsoluteWindow, zonedYmdString, getHourMinuteInTimeZone } from '@/utils/postingScheduleWindow';
import { getNextPublishDateRef, sameZonedDay } from '@/utils/automationPlanSchedule';
import {
  generateImagePrompt,
  generateImage,
  generatePostText,
  getAutomationCronBaseUrl,
} from '@/lib/automationPlanContentGeneration';
import {
  parseAutomationCronParams,
  effectivePlanForPostingClock,
} from '@/lib/automationCronQueryParams';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_TIME_TOLERANCE_MIN = Math.min(
  60,
  Math.max(5, Number(process.env.AUTOMATION_CRON_TOLERANCE_MINUTES) || 15)
);

export async function GET(request) {
  // No CRON_SECRET gate — crons are triggered by localhost curl on EC2 (no auth
  // header). Restrict at the firewall / nginx if the host is publicly exposed.
  const cronParams = parseAutomationCronParams(request.url);
  const forceRun = cronParams.force;
  const manualTriggerLogged = cronParams.manualTrigger;

  const BASE_URL = getAutomationCronBaseUrl();
  const logs = [];
  const log = (msg, extra) => {
    const line = extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
    logs.push(line);
    console.log('[AUTO-POST]', line);
  };

  const prefetchNow = new Date();
  const istHm = getHourMinuteInTimeZone(prefetchNow, 'Asia/Kolkata');

  log(
    `Prefetch START — UTC=${prefetchNow.toISOString()} | IST=${zonedYmdString(prefetchNow, 'Asia/Kolkata')} ${String(istHm.hour).padStart(2, '0')}:${String(istHm.minute).padStart(2, '0')} | BASE_URL=${BASE_URL}`
  );
  log(
    `cron flags force=${forceRun} manualTrigger=${manualTriggerLogged} testNow=${cronParams.testNow} dryRun=${cronParams.dryRun}`
  );

  await dbConnect();

  const activePlans = await AutomationPlan.find({
    active: true,
    automationEnabled: true,
    $nor: [{ postQueueMode: 'delay_generate_publish' }],
  }).lean();

  log(`Active automation plans (legacy prefetch queue): ${activePlans.length}`);

  const prefetchStats = { processed: 0, prefetched: 0, skipped: 0, failed: 0, errors: [] };

  for (const plan of activePlans) {
    prefetchStats.processed++;
    const planId = plan._id;
    const keywords = plan.keywords || [];
    const postIndex = plan.postIndex ?? 0;
    const tz = plan.postingTimezone || 'Asia/Kolkata';
    const effectivePlan = effectivePlanForPostingClock(plan, cronParams, prefetchNow);
    log(`[prefetch] Plan ${planId} userId=${plan.userId} TZ=${tz}`, {
      postingWindowPlan: `${plan.postingHour}:${String(plan.postingMinute ?? 0).padStart(2, '0')}`,
      effectiveClock:
        effectivePlan._clockOverrideReason ||
        `${effectivePlan.postingHour}:${String(effectivePlan.postingMinute ?? 0).padStart(2, '0')} (DB)`,
      prefetchOffsetMinutes: plan.prefetchOffsetMinutes ?? 1440,
      cronToleranceMin: CRON_TIME_TOLERANCE_MIN,
    });

    const nextRef = getNextPublishDateRef(plan, prefetchNow);
    if (!nextRef) {
      log('[prefetch] Skip — no upcoming publish date in schedule/frequency');
      prefetchStats.skipped++;
      continue;
    }

    const bypassPrefetchWindow =
      forceRun || cronParams.testNow || manualTriggerLogged;
    if (
      !bypassPrefetchWindow &&
      !matchesPrefetchAbsoluteWindow(effectivePlan, nextRef, prefetchNow, CRON_TIME_TOLERANCE_MIN)
    ) {
      log(
        `[prefetch] Skip — outside prefetch window (offset=${plan.prefetchOffsetMinutes ?? 1440}m, tol=${CRON_TIME_TOLERANCE_MIN}m) force=${forceRun}`
      );
      prefetchStats.skipped++;
      continue;
    }
    if (bypassPrefetchWindow) {
      log(
        `[prefetch] Window bypass active — force=${forceRun} testNow=${cronParams.testNow} manualTrigger=${manualTriggerLogged}`
      );
    }

    let limit = plan.planDetails?.limit ?? 0;
    if (!limit) {
      let u = null;
      if (plan.userRef) {
        u = await User.findById(plan.userRef).select('paidPackage planDuration').lean().catch(() => null);
      }
      if (!u && plan.userId) {
        u = await User.findOne({ userId: plan.userId }).select('paidPackage planDuration').lean().catch(() => null);
      }
      if (u) limit = getPlanPostLimit(u.paidPackage, u.planDuration);
    }
    const postsUsed = plan.planDetails?.postsUsed ?? 0;
    if (limit > 0 && postsUsed >= limit) {
      log('Prefetch skip — quota exhausted');
      prefetchStats.skipped++;
      continue;
    }

    if (!keywords.length) {
      log('Prefetch skip — no keywords');
      prefetchStats.skipped++;
      continue;
    }

    if (plan.endDate && zonedYmdString(nextRef, tz) > zonedYmdString(plan.endDate, tz)) {
      log('Prefetch skip — next publish after plan end date');
      prefetchStats.skipped++;
      continue;
    }

    const pf = plan.prefetchPost;
    if (pf?.imageUrl && pf?.postText && pf?.publishOn && sameZonedDay(pf.publishOn, nextRef, tz)) {
      log('Prefetch skip — bundle already stored for that publish day');
      prefetchStats.skipped++;
      continue;
    }

    const keyword = keywords[postIndex % keywords.length];
    const loc0 = (plan.locations || [])[0];
    const cityName = loc0?.locality || loc0?.name || plan.businessName || '';

    try {
      const imagePrompt = await generateImagePrompt({
        keyword,
        businessName: plan.businessName || '',
        cityName,
      });
      const imageUrl = await generateImage({
        imagePrompt,
        keyword,
        businessName: plan.businessName || '',
        imageConfig: plan.imageConfig || {},
      });
      const postText = await generatePostText({
        businessName: plan.businessName || '',
        keyword,
        cityName,
      });
      const imgTrim = String(imageUrl || '').trim();
      const txtTrim = String(postText || '').trim();
      if (!imgTrim || !txtTrim) {
        log('Prefetch FAIL — empty imageUrl or postText after generation', {
          imageLen: imgTrim.length,
          textLen: txtTrim.length,
        });
        prefetchStats.failed++;
        continue;
      }
      await AutomationPlan.updateOne(
        { _id: planId },
        {
          $set: {
            prefetchPost: {
              publishOn: nextRef,
              imageUrl: imgTrim,
              postText: txtTrim,
              keyword,
              generatedAt: new Date(),
            },
          },
        }
      );
      log(`Prefetch OK — stored AutomationPlan.prefetchPost`, {
        publishOnYmd: zonedYmdString(nextRef, tz),
        keyword,
        imageUrlPreview: `${imgTrim.slice(0, 120)}…`,
        postTextPreview: `${txtTrim.slice(0, 160)}…`,
      });
      prefetchStats.prefetched++;
    } catch (e) {
      log(`Prefetch ERROR — ${e.message}`);
      prefetchStats.errors.push({ planId: planId.toString(), error: e.message });
      prefetchStats.failed++;
    }
  }

  log('Prefetch complete', prefetchStats);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    phase: 'prefetch',
    force: forceRun,
    manualTrigger: manualTriggerLogged,
    testNow: cronParams.testNow,
    dryRun: cronParams.dryRun,
    istNow: `${zonedYmdString(prefetchNow, 'Asia/Kolkata')} ${String(istHm.hour).padStart(2, '0')}:${String(istHm.minute).padStart(2, '0')}`,
    note: 'Prefetch only: stores image+caption+keyword in AutomationPlan.prefetchPost; publish runs via /api/cron/automation-plans.',
    nextStep:
      'Run GET /api/cron/automation-plans?phase=publish (or phase=tick). Use force=true to bypass guards while testing.',
    ...prefetchStats,
    logs,
  });
}
