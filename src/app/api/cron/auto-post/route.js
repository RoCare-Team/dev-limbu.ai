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
 * Query: ?force=1 — process every eligible plan even outside the prefetch time window (testing).
 *
 * Auth: if CRON_SECRET is set, require Authorization: Bearer <CRON_SECRET> (same as before).
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import AutomationPlan from '@/models/AutomationPlan';
import { getPlanPostLimit } from '@/utils/userSettingsHelpers';
import { matchesPrefetchAbsoluteWindow, zonedYmdString } from '@/utils/postingScheduleWindow';
import { getNextPublishDateRef, sameZonedDay } from '@/utils/automationPlanSchedule';
import {
  generateImagePrompt,
  generateImage,
  generatePostText,
  getAutomationCronBaseUrl,
} from '@/lib/automationPlanContentGeneration';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_TIME_TOLERANCE_MIN = Math.min(
  60,
  Math.max(5, Number(process.env.AUTOMATION_CRON_TOLERANCE_MINUTES) || 15)
);

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const forceRun = searchParams.get('force') === '1';

  const BASE_URL = getAutomationCronBaseUrl();
  const logs = [];
  const log = (msg, extra) => {
    const line = extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
    logs.push(line);
    console.log('[AUTO-POST]', line);
  };

  log(`Starting prefetch — force=${forceRun} — ${new Date().toISOString()} — BASE_URL=${BASE_URL}`);

  await dbConnect();

  const activePlans = await AutomationPlan.find({
    active: true,
    automationEnabled: true,
  }).lean();

  log(`Found ${activePlans.length} active plan(s)`);

  const prefetchStats = { processed: 0, prefetched: 0, skipped: 0, failed: 0, errors: [] };
  const prefetchNow = new Date();

  for (const plan of activePlans) {
    prefetchStats.processed++;
    const planId = plan._id;
    const keywords = plan.keywords || [];
    const postIndex = plan.postIndex ?? 0;
    const tz = plan.postingTimezone || 'Asia/Kolkata';

    log(`[prefetch] Plan ${planId} (userId=${plan.userId})`);

    const nextRef = getNextPublishDateRef(plan, prefetchNow);
    if (!nextRef) {
      log('[prefetch] Skip — no upcoming publish date in schedule/frequency');
      prefetchStats.skipped++;
      continue;
    }

    if (!forceRun && !matchesPrefetchAbsoluteWindow(plan, nextRef, prefetchNow, CRON_TIME_TOLERANCE_MIN)) {
      log(
        `[prefetch] Skip — outside prefetch window (offset=${plan.prefetchOffsetMinutes ?? 1440}m, tol=${CRON_TIME_TOLERANCE_MIN}m)`
      );
      prefetchStats.skipped++;
      continue;
    }

    let limit = plan.planDetails?.limit ?? 0;
    if (!limit && plan.userRef) {
      const u = await User.findById(plan.userRef).select('paidPackage planDuration').lean();
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
      if (!imageUrl || !postText) {
        log('Prefetch FAIL — missing imageUrl or postText');
        prefetchStats.failed++;
        continue;
      }
      await AutomationPlan.updateOne(
        { _id: planId },
        {
          $set: {
            prefetchPost: {
              publishOn: nextRef,
              imageUrl,
              postText,
              keyword,
              generatedAt: new Date(),
            },
          },
        }
      );
      log(`Prefetch OK — publishOn=${zonedYmdString(nextRef, tz)} keyword="${keyword}"`);
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
    note: 'Prefetch only: this route stores image+caption in AutomationPlan.prefetchPost and does not create PostStatus rows.',
    nextStep: 'Run GET /api/cron/automation-plans?phase=publish (or phase=tick) at posting time to publish and save posts in PostStatus.',
    ...prefetchStats,
    logs,
  });
}
