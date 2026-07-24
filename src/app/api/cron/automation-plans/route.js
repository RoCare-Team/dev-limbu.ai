/**
 * GET /api/cron/automation-plans
 *
 * Fully-automated daily posting cron.
 * - Tokens (accessToken + refreshToken) are stored IN the AutomationPlan at
 *   user-settings save time — no GmbUser lookup needed at cron time.
 * - If accessToken is expired → refresh via refreshToken → update plan in DB.
 * - Saves post to DB as "pending" (same payload as savePostAction / manual flow).
 * - Posts to GMB via /api/post-to-gmb then updates post to "posted".
 * - Respects user's plan: limit, frequency, schedule dates.
 *
 * Query params:
 *   ?force=true | force=1     — bypass posting-day duplicate guard, clock window, and start-day gate (testing)
 *   ?dryRun=true | dryRun=1    — generate image + text, save as "pending", skip live network posts
 *   ?manualTrigger=true        — skip publish clock window only (posting day + duplicate rules still apply unless force)
 *   ?testNow=true              — evaluate postingHour:postingMinute as "now" in plan TZ for window checks only (no DB write)
 *   ?testPostingHour=&testPostingMinute= — explicit clock override for window checks only
 *
 * Prefetch (image prompt, Cloudinary/aiAssets URL, post text) lives in /api/cron/auto-post.
 * This route’s publish phase posts to GMB, Facebook, Instagram using plan.prefetchPost when
 * prefetchOffsetMinutes ≥ 1440, or generates inline when not in 24h-prefetch mode.
 *
 * ?phase=dailyAutomation — publish only (same as tick).
 * ?phase=tick — publish only; use with a frequent cron so postingHour:postingMinute (IST) is honored.
 * ?phase=manual&userId=USR_… — Postman/on-demand: same publish pipeline (image + GMB post) for one user.
 *   Requires Authorization: Bearer CRON_SECRET when env CRON_SECRET is set.
 *   Validates start/end, frequency/schedule day, quota, locations — skips clock window only.
 * postingHour / postingMinute gate scheduled cron; prefetch runs 24h before (prefetchOffsetMinutes, default 1440).
 * With prefetchOffsetMinutes >= 1440: local startDate is prefetch-only; first publish is next IST day using the
 * same prefetched image+copy for GMB, Facebook, and Instagram in one publish run when prefetch ran; if the bundle
 * is missing, image+copy are generated inline so a missed /api/cron/auto-post window does not block publishing.
 */

import { NextResponse } from 'next/server';
import dbConnect        from '@/lib/dbConnect';
import User             from '@/models/User';
import Post             from '@/models/PostStatus';
import AutomationPlan   from '@/models/AutomationPlan';
import { getGmbConnection } from '@/lib/gmbSession';
import { getPlanPostLimit } from '@/utils/userSettingsHelpers';
import {
  matchesPostingWindow,
  zonedYmdString,
  getHourMinuteInTimeZone,
} from '@/utils/postingScheduleWindow';
import {
  isPostingDayTodayZoned,
  getPublishUtcMsForDateRef,
  sameZonedDay,
} from '@/utils/automationPlanSchedule';
import {
  generateImagePrompt,
  generateImageAndText,
} from '@/lib/automationPlanContentGeneration';
import {
  parseAutomationCronParams,
  effectivePlanForPostingClock,
} from '@/lib/automationCronQueryParams';
import { createRunLogger } from '@/lib/automationRunLogger';
import { getEffectivePackageExpiry } from '@/utils/userPlanExpiry';
import {
  normalizeIndiaPhone,
  sendDailyPostUpdateWhatsApp,
} from '@/lib/dailyPostWhatsApp';

export const dynamic     = 'force-dynamic';
export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const CRON_TIME_TOLERANCE_MIN = Math.min(
  60,
  Math.max(5, Number(process.env.AUTOMATION_CRON_TOLERANCE_MINUTES) || 15)
);

// ─── User resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the plan's User by Mongo _id (userRef) OR by USR-format userId.
 * Older plans may not have userRef set, so falling back to userId prevents the
 * cron from treating a valid package as expired (which would wrongly skip and
 * deactivate the plan).
 */
async function resolvePlanUser(userRef, userId, projection) {
  if (userRef) {
    const byRef = await User.findById(userRef).select(projection).lean().catch(() => null);
    if (byRef) return byRef;
  }
  if (userId) {
    return User.findOne({ userId }).select(projection).lean().catch(() => null);
  }
  return null;
}

// ─── Token helper ─────────────────────────────────────────────────────────────

/**
 * Use the stored refreshToken to get a fresh accessToken from Google.
 * Also persists the new token back to the AutomationPlan so future runs use it.
 */
async function refreshGoogleToken(refreshToken, planId) {
  console.log('[CRON] 🔑 Refreshing Google OAuth token for planId:', planId);

  if (!refreshToken) throw new Error('No refreshToken stored in AutomationPlan');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();
  console.log('[CRON] 🔑 Token refresh HTTP status:', res.status, '| error:', data.error || 'none');

  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Token refresh failed');
  }

  const newAccessToken = data.access_token;

  // Persist fresh token back to the plan so subsequent cron runs work without refresh
  await AutomationPlan.updateOne({ _id: planId }, { $set: { accessToken: newAccessToken } });
  console.log('[CRON] 🔑 New accessToken saved to AutomationPlan');

  return newAccessToken;
}

// ─── GMB posting ──────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "Photo gallery upload failed" happens when Google fetches the image for the photo
// gallery (checkmark 'both') before the freshly generated image is fully available on
// S3, or on a transient media hiccup. Warm the URL first so Google's fetch succeeds.
async function warmImageUrl(url, log) {
  if (!url) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (r.ok) {
        // Drain the body so the S3/CDN object is definitely materialized before Google fetches it.
        await r.arrayBuffer().catch(() => {});
        if (log) log(`Image warm OK (attempt ${attempt + 1}) — ${url.slice(0, 80)}`);
        return true;
      }
      if (log) log(`Image warm HTTP ${r.status} (attempt ${attempt + 1})`);
    } catch (e) {
      if (log) log(`Image warm error (attempt ${attempt + 1}): ${e.message}`);
    }
    await sleep(1500 * (attempt + 1));
  }
  return false;
}

// A failure list where EVERY failure is the photo-gallery step (and nothing succeeded)
// is safe to retry — no post was created, and the gallery step is the flaky part.
function isGalleryOnlyFailure(failList) {
  if (!Array.isArray(failList) || failList.length === 0) return false;
  return failList.every((f) => /photo gallery|gallery upload/i.test(String(f?.error || f?.message || '')));
}

/**
 * Calls /api/gmb/publish — the SAME working endpoint the manual frontend uses
 * (postToGmbAction). Payload shape matches the manual post:
 *   account, locationData, output, description, accessToken, checkmark
 * `skipDbUpdate` is set because this cron manages PostStatus itself.
 *
 * Reliability: keeps checkmark 'both' (post + photo gallery). Warms the image URL
 * first, and retries when the ONLY failure is "Photo gallery upload failed" and
 * nothing succeeded — that step is intermittent on freshly generated images.
 * Returns { ok, httpStatus, data }
 */
async function postToGmb({ account, locationData, imageUrl, description, accessToken, postId, userId }, log) {
  // ── Build payload for GMB publish — EXACT manual-flow shape ──────────────
  // Diagnostic proof: the SAME image fails with "Photo gallery upload failed"
  // when sent WITHOUT postId/userId (and with skipDbUpdate:true), but SUCCEEDS
  // when sent WITH postId/userId and no skipDbUpdate. The upstream photo-upload
  // step needs postId/userId, so mirror the manual payload exactly.
  const payload = {
    postId:      postId || '',
    userId:      userId || '',
    account,
    locationData,          // [{ city, cityName, bookUrl, account }]
    output:      imageUrl || '',
    video_url:   '',
    description,
    accessToken: accessToken || '',
    checkmark:   'both',   // image attaches to the post AND the photo gallery
    post_type:   'standard',
    cta:         'learn_more',
    startDate:   '',
    endDate:     '',
    tittle:      '',
    wait_video:  false,
  };

  console.log('[CRON] 📮 postToGmb payload (exact same as manual post):', JSON.stringify({
    account,
    locationDataCount: locationData?.length,
    locationData,
    output:         payload.output?.slice(0, 100),
    description:    description,
    checkmark:      'both',
    accessTokenLen: accessToken?.length || 0,
  }, null, 2));

  // Pre-warm the image so Google's photo-gallery fetch doesn't race a fresh S3 upload.
  await warmImageUrl(imageUrl, log);

  const MAX_GALLERY_ATTEMPTS = 3; // 1 initial + up to 2 gallery retries

  const runOnce = async () => {
    const res = await fetch(`${BASE_URL}/api/gmb/publish`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    console.log('[CRON] 📮 gmb/publish HTTP status:', res.status);
    const text = await res.text();
    console.log('[CRON] 📮 gmb/publish FULL raw response:', text.slice(0, 12000));

    let data;
    try   { data = text ? JSON.parse(text) : {}; }
    catch { data = { raw: text }; }

    // /api/gmb/publish wraps the upstream response as { ok, data: { success, fail, succeeded, failed, total } }.
    // Inspect per-location results (HTTP 200 with a non-empty `fail` list is NOT success).
    // The upstream sometimes nests the result one level deeper (`data.data.data`) — unwrap it.
    const outer = data && typeof data.data === 'object' && data.data ? data.data : {};
    const publishData =
      Array.isArray(outer.success) ||
      Array.isArray(outer.fail) ||
      outer.succeeded != null ||
      outer.failed != null
        ? outer
        : outer.data && typeof outer.data === 'object'
          ? outer.data
          : outer;
    const successList = Array.isArray(publishData.success) ? publishData.success : [];
    const failList = Array.isArray(publishData.fail) ? publishData.fail : [];
    const succeeded = Number(publishData.succeeded) || successList.length;
    const failed = Number(publishData.failed) || failList.length;
    const httpOk = res.ok && data?.ok !== false;
    const reallyOk =
      httpOk && failed === 0 && (succeeded > 0 || (successList.length === 0 && failList.length === 0));

    const failMessages = failList.map((f) => String(f?.error || f?.message || '')).join(' | ');
    const authError =
      [401, 403].includes(res.status) ||
      /invalid authentication|unauthenticated|oauth 2|invalid_grant|access token|login cookie|permission/i.test(failMessages);

    return {
      ok: reallyOk, httpStatus: res.status, authError, succeeded, failed,
      failList, data, rawBody: text,
    };
  };

  try {
    let result;
    for (let attempt = 1; attempt <= MAX_GALLERY_ATTEMPTS; attempt++) {
      result = await runOnce();
      // Only retry the flaky, non-destructive case: gallery-only failure with nothing posted.
      const galleryRetryable =
        !result.ok && result.succeeded === 0 && isGalleryOnlyFailure(result.failList);
      if (result.ok || !galleryRetryable || attempt === MAX_GALLERY_ATTEMPTS) {
        if (galleryRetryable && attempt === MAX_GALLERY_ATTEMPTS && log) {
          log(`GMB gallery upload still failing after ${attempt} attempts — giving up`);
        }
        break;
      }
      const waitMs = 4000 * attempt; // 4s, then 8s — let the media settle on Google's side
      if (log) log(`GMB "Photo gallery upload failed" — re-warming image and retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_GALLERY_ATTEMPTS})`);
      await warmImageUrl(imageUrl, log);
      await sleep(waitMs);
    }
    const { failList: _omit, ...rest } = result;
    return rest;
  } catch (err) {
    console.error('[CRON] ❌ postToGmb EXCEPTION:', err.message);
    return { ok: false, httpStatus: 500, authError: false, data: err.message, rawBody: '' };
  }
}

async function postToFacebookPages({ userId, fbPages, caption, imageUrl }) {
  const results = [];
  for (const fbPage of fbPages || []) {
    if (!fbPage.pageId || !fbPage.pageAccessToken) continue;
    try {
      const res = await fetch(`${BASE_URL}/api/facebook/post`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId,
          pageId:          fbPage.pageId,
          caption,
          imageUrl:        imageUrl || '',
          pageAccessToken: fbPage.pageAccessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Facebook post failed');
      results.push({ pageId: fbPage.pageId, success: true });
    } catch (e) {
      results.push({ pageId: fbPage.pageId, success: false, error: e.message });
    }
  }
  return results;
}

async function postToInstagramAccounts({ userId, igPages, caption, imageUrl }) {
  const results = [];
  for (const ig of igPages || []) {
    if (!ig.igId || !ig.pageAccessToken) continue;
    try {
      const res = await fetch(`${BASE_URL}/api/instagram/post`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId,
          igUserId:    ig.igId,
          caption,
          imageUrl:    imageUrl || '',
          accessToken: ig.pageAccessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Instagram post failed');
      results.push({ igId: ig.igId, success: true });
    } catch (e) {
      results.push({ igId: ig.igId, success: false, error: e.message });
    }
  }
  return results;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const cronParams = parseAutomationCronParams(request.url);
  const forceRun = cronParams.force;
  const dryRun = cronParams.dryRun;

  console.log('\n[CRON] ═══════════════════════════════════════════════════════');
  console.log('[CRON] automation-plans cron START —', new Date().toISOString());
  console.log('[CRON] BASE_URL:', BASE_URL);
  console.log(
    `[CRON] Parsed query — force=${forceRun} dryRun=${dryRun} manualTrigger=${cronParams.manualTrigger} testNow=${cronParams.testNow} (from URL searchParams)`
  );

  let phase = new URL(request.url).searchParams.get('phase') || 'publish';
  console.log(`[CRON] phase=${phase}`);

  if (phase === 'dailyAutomation' || phase === 'tick') {
    const origin = new URL(request.url);
    origin.searchParams.set('phase', 'publish');
    const publishRes = await GET(new Request(origin.toString(), { headers: request.headers }));
    const publishJson = await publishRes.json();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      phase,
      force: cronParams.force,
      dryRun: cronParams.dryRun,
      manualTrigger: cronParams.manualTrigger,
      testNow: cronParams.testNow,
      publish: publishJson,
      note: 'Prefetch (image + copy) runs at GET /api/cron/auto-post — schedule it prefetchOffsetMinutes before publish (default 1440 = 24h).',
    });
  }

  if (phase === 'prefetch') {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      phase: 'prefetch',
      deprecated: true,
      force: cronParams.force,
      manualTrigger: cronParams.manualTrigger,
      testNow: cronParams.testNow,
      message:
        'Image and caption prefetch moved to GET /api/cron/auto-post. This route only publishes to GMB / Facebook / Instagram.',
      hint: 'Schedule /api/cron/auto-post so it hits the prefetch window (posting time minus prefetchOffsetMinutes, default 24h). Use phase=publish or phase=tick here for posting.',
    });
  }

  await dbConnect();
  console.log('[CRON] ✓ DB connected');

  const logs = [];
  const log = (msg, extra) => {
    const line = extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
    logs.push(line);
    console.log('[CRON]', line);
  };

  let skipPublishClockWindow = false;
  /** True when phase=manual or explicit ?manualTrigger=true */
  let manualTriggerEffective = cronParams.manualTrigger;
  let activePlans;

  if (phase === 'manual') {
    const manualUserId = new URL(request.url).searchParams.get('userId')?.trim();
    // No CRON_SECRET gate — triggered by localhost curl on EC2 (no auth header).
    if (!manualUserId) {
      return NextResponse.json(
        {
          error: 'Missing userId',
          hint: 'GET /api/cron/automation-plans?phase=manual&userId=YOUR_USR_ID (optional &dryRun=1)',
        },
        { status: 400 }
      );
    }
    const one = await AutomationPlan.findOne({
      userId:              manualUserId,
      active:              true,
      automationEnabled:   true,
      $nor:                 [{ postQueueMode: 'delay_generate_publish' }],
    }).lean();
    if (!one) {
      return NextResponse.json(
        { error: 'No active automation plan for this userId', userId: manualUserId },
        { status: 404 }
      );
    }
    activePlans = [one];
    skipPublishClockWindow = true;
    manualTriggerEffective = true;
    phase = 'publish';
    log(`Manual trigger phase=manual userId=${manualUserId} manualTrigger=true — schedule/frequency/start/end enforced; publish clock window skipped`);
  } else {
    activePlans = await AutomationPlan.find({
      active:              true,
      automationEnabled:   true,
      $nor:                 [{ postQueueMode: 'delay_generate_publish' }],
    }).lean();
  }

  skipPublishClockWindow = skipPublishClockWindow || cronParams.manualTrigger;

  const runNow = new Date();
  const istHm = getHourMinuteInTimeZone(runNow, 'Asia/Kolkata');
  log(
    `Run context — UTC=${runNow.toISOString()} IST=${zonedYmdString(runNow, 'Asia/Kolkata')} ${String(istHm.hour).padStart(2, '0')}:${String(istHm.minute).padStart(2, '0')} | activePlans=${activePlans.length} phase=${phase} force=${forceRun} dryRun=${dryRun} manualTrigger=${manualTriggerEffective} testNow=${cronParams.testNow}`
  );
  console.log('[CRON] Plan IDs:', activePlans.map((p) => p._id.toString()));

  const results = { processed: 0, successful: 0, skipped: 0, failed: 0, errors: [] };

  // Persistent step log — one AutomationLog doc per plan, every guard/action
  // recorded pass/fail/skip with the real error. View at GET /api/automation-logs.
  const triggerStr = [
    `phase=${phase}`,
    forceRun ? 'force' : '',
    dryRun ? 'dryRun' : '',
    manualTriggerEffective ? 'manual' : '',
    cronParams.testNow ? 'testNow' : '',
  ].filter(Boolean).join(' ');
  const run = createRunLogger({ phase: 'publish', trigger: triggerStr, source: 'automation' });

  for (const plan of activePlans) {
    const {
      _id: planId,
      userId,           // USR-format userId stored by user-settings
      userRef,
      keywords     = [],
      postIndex    = 0,
      locations    = [],
      businessName = '',
      imageConfig  = {},
      planDetails  = {},
      gmbProjectId,
      endDate,
      lastPostDate,
      startDate,
      accessToken:  storedAccessToken  = '',
      refreshToken: storedRefreshToken = '',
      platforms    = ['gmb'],
      fbPages      = [],
      igPages      = [],
      prefetchPost = null,
    } = plan;

    let { limit = 0, postsUsed = 0 } = planDetails;
    if (!limit) {
      const u = await resolvePlanUser(userRef, userId, 'paidPackage planDuration packageExpiryDate');
      if (u) {
        const computed = getPlanPostLimit(u.paidPackage, u.planDuration);
        const fallback = Math.max((keywords || []).length, 1);
        const limitToUse = computed > 0 ? computed : fallback;
        if (limitToUse > 0) {
          limit = limitToUse;
          log(`Hydrated planDetails.limit=${limit} from User package${computed ? '' : ' (package unknown — keyword count floor)'}`);
          await AutomationPlan.updateOne(
            { _id: planId },
            {
              $set: {
                'planDetails.limit':       limit,
                'planDetails.expiryDate':  u.packageExpiryDate,
              },
            }
          );
        }
      }
    }

    const platformsSafe = Array.isArray(platforms) && platforms.length ? platforms : ['gmb'];
    const wantGmb = platformsSafe.includes('gmb');
    const wantFb  = platformsSafe.includes('fb') && Array.isArray(fbPages) && fbPages.some((p) => p.pageId && p.pageAccessToken);
    const wantIg  = platformsSafe.includes('ig') && Array.isArray(igPages) && igPages.some((a) => a.igId && a.pageAccessToken);

    results.processed++;

    const slog = run.plan({ userId, planId });
    slog.info('plan:start', `platforms=${platformsSafe.join(',')} keywords=${keywords.length} locations=${locations.length}`);

    console.log('\n[CRON] ─────────────────────────────────────────────────');
    console.log('[CRON] Plan:', planId.toString(), '| userId:', userId);
    console.log('[CRON] Plan details:', JSON.stringify({
      keywords,
      postIndex,
      locationsCount: locations.length,
      locations,
      businessName,
      gmbProjectId,
      startDate,
      endDate,
      lastPostDate,
      limit,
      postsUsed,
      platforms: platformsSafe,
      fbPagesCount: fbPages?.length || 0,
      igPagesCount: igPages?.length || 0,
      hasAccessToken:  !!storedAccessToken,
      hasRefreshToken: !!storedRefreshToken,
    }, null, 2));

    log(`── Plan ${planId} (userId=${userId}) ──`);

    const runNow = new Date();
    const tz = plan.postingTimezone || 'Asia/Kolkata';

    if (forceRun) {
      log(
        `force=true — bypassing guards: start-date / scheduled-day / duplicate-today / publish-clock`
      );
    }

    if (endDate && zonedYmdString(runNow, tz) > zonedYmdString(endDate, tz)) {
      // Use the LATEST of packageExpiryDate and subscription.expiry — a renewal
      // may have updated only subscription.expiry, leaving packageExpiryDate stale
      // (that wrongly deactivated active users).
      const uPkg = await resolvePlanUser(userRef, userId, 'packageExpiryDate subscription');
      const pkgExp = getEffectivePackageExpiry(uPkg);
      if (pkgExp && pkgExp.getTime() > runNow.getTime()) {
        await AutomationPlan.updateOne({ _id: planId }, { $set: { endDate: pkgExp } });
        plan.endDate = pkgExp;
        log(`Extended endDate to effective plan expiry (${pkgExp.toISOString()}) — plan end was stale`);
      } else {
        log(`Skip — end date passed: ${endDate}`);
        slog.skip('guard:end-date', `end date passed (${endDate}) — plan deactivated`);
        await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
        results.skipped++; continue;
      }
    }

    if (!forceRun) {
      if (startDate && zonedYmdString(runNow, tz) < zonedYmdString(startDate, tz)) {
        log(`Skip — start date not reached yet: ${startDate}`);
        slog.skip('guard:start-date', `start date not reached yet (${zonedYmdString(startDate, tz)})`);
        results.skipped++; continue;
      }

      if (!isPostingDayTodayZoned(plan, runNow)) {
        log(`Skip — not a scheduled posting day (frequency/schedule/start/end in ${tz})`);
        slog.skip('guard:posting-day', `today is not a scheduled posting day (frequency/schedule)`);
        results.skipped++; continue;
      }

      const lastPostBeforeStart =
        lastPostDate &&
        startDate &&
        zonedYmdString(lastPostDate, tz) < zonedYmdString(startDate, tz);
      if (
        !lastPostBeforeStart &&
        lastPostDate &&
        zonedYmdString(lastPostDate, tz) === zonedYmdString(runNow, tz)
      ) {
        log(`Skip — already posted today (duplicate guard). lastPostDate=${lastPostDate} — pass force=true to bypass`);
        slog.skip('guard:duplicate-today', `already posted today (lastPostDate=${lastPostDate})`);
        results.skipped++; continue;
      }

      if (!skipPublishClockWindow) {
        const effectivePlan = effectivePlanForPostingClock(plan, cronParams, runNow);
        if (effectivePlan._clockOverrideReason) {
          log(`test clock override active — ${effectivePlan._clockOverrideReason}`);
        }
        const ph = effectivePlan.postingHour;
        const hasHour = ph != null && ph !== '' && !Number.isNaN(Number(ph));
        const planHm = getHourMinuteInTimeZone(runNow, tz);
        log(
          `Posting window — TZ=${tz} localNow=${zonedYmdString(runNow, tz)} ${planHm.hour}:${String(planHm.minute).padStart(2, '0')} | stored_clock=${plan.postingHour}:${String(plan.postingMinute ?? 0).padStart(2, '0')} | effective_clock=${effectivePlan.postingHour}:${String(effectivePlan.postingMinute ?? 0).padStart(2, '0')} | toleranceMin=${CRON_TIME_TOLERANCE_MIN}`
        );

        if (hasHour) {
          const publishMs = getPublishUtcMsForDateRef(effectivePlan, runNow);
          // Fire AT or AFTER the chosen time — never early. EARLY_GRACE only
          // absorbs small server-clock skew; the late side spans the cron
          // tolerance so a skipped cron run still publishes (the duplicate-today
          // guard above prevents a second post the same day).
          const EARLY_GRACE_MS = 60 * 1000;
          const lateMs = CRON_TIME_TOLERANCE_MIN * 60 * 1000;
          const delta = publishMs == null ? null : runNow.getTime() - publishMs;
          const inWin =
            delta != null && delta >= -EARLY_GRACE_MS && delta <= lateMs;
          log(
            `Absolute window eval — publishUtcMs=${publishMs} deltaMin=${delta == null ? 'n/a' : (delta / 60000).toFixed(1)} inWindow=${inWin}`
          );
          if (!inWin) {
            log(
              `Skip — not yet at / past publish time (effective ${effectivePlan.postingHour}:${String(effectivePlan.postingMinute ?? 0).padStart(2, '0')} ${tz})`
            );
            slog.skip('guard:clock-window', `not yet at/past publish time ${effectivePlan.postingHour}:${String(effectivePlan.postingMinute ?? 0).padStart(2, '0')} ${tz} (deltaMin=${delta == null ? 'n/a' : (delta / 60000).toFixed(1)})`);
            results.skipped++; continue;
          }
        } else if (!matchesPostingWindow(effectivePlan, runNow)) {
          log(`Skip — outside posting time window (legacy)`);
          slog.skip('guard:clock-window', 'outside posting time window (legacy matcher)');
          results.skipped++; continue;
        }
      }
    }

    if (limit > 0 && postsUsed >= limit) {
      log(`Skip — quota exhausted: ${postsUsed}/${limit}`);
      slog.skip('guard:quota', `quota exhausted ${postsUsed}/${limit}`);
      results.skipped++; continue;
    }

    if (!keywords.length) {
      log(`Skip — no keywords configured in plan`);
      slog.skip('guard:no-keywords', 'no keywords configured in plan');
      results.skipped++; continue;
    }

    // Keywords rotate: keywords[postIndex % length] (same as docstring). Quota is planDetails.limit + postsUsed.

    const prefetchLead =
      Number(plan.prefetchOffsetMinutes) >= 1440;
    const hasPrefetchForToday =
      !!prefetchPost?.imageUrl &&
      !!prefetchPost?.postText &&
      prefetchPost?.publishOn &&
      sameZonedDay(prefetchPost.publishOn, runNow, tz);

    if (prefetchLead) {
      if (
        prefetchPost?.publishOn &&
        zonedYmdString(prefetchPost.publishOn, tz) < zonedYmdString(runNow, tz)
      ) {
        await AutomationPlan.updateOne({ _id: planId }, { $unset: { prefetchPost: 1 } });
        log('Removed stale prefetch (missed publish day)');
      }
      if (!hasPrefetchForToday && !forceRun && !dryRun) {
        log(
          '⚠ Prefetch bundle missing for today — generating image+copy inline (schedule /api/cron/auto-post for 24h-ahead prefetch to avoid duplicate AI work)'
        );
      }
    }

    if (wantGmb && !locations.length) {
      log(`FAIL — GMB enabled but no locations in AutomationPlan`);
      slog.fail('config:no-locations', 'GMB enabled but no locations configured in AutomationPlan');
      results.errors.push({ planId: planId.toString(), userId, error: 'No locations configured for GMB' });
      results.failed++; continue;
    }

    if (!wantGmb && !wantFb && !wantIg) {
      log(`FAIL — no platforms enabled (platforms=${JSON.stringify(platformsSafe)})`);
      slog.fail('config:no-platforms', `no usable platforms enabled (platforms=${JSON.stringify(platformsSafe)}; FB/IG may be missing tokens)`);
      results.errors.push({ planId: planId.toString(), userId, error: 'No platforms enabled' });
      results.failed++; continue;
    }

    // ── 2. userId — AutomationPlan now stores USR-format userId (set by user-settings)
    // This is the same value as localStorage.getItem("userId") in the dashboard.
    // Use it directly — no User lookup needed for userId.
    const resolvedUserId = userId;   // already USR-format since user-settings fix
    console.log('[CRON] 🔍 Using plan userId (USR-format):', resolvedUserId);
    log(`userId: ${resolvedUserId}`);

    // ── 3. Resolve access token ───────────────────────────────────────────────
    // Use the accessToken stored in the AutomationPlan (saved at user-settings time).
    // If no accessToken or it looks empty, pre-emptively refresh using refreshToken.
    // If GMB post later returns 401/403, we refresh again and retry (step 9 below).
    let accessToken = storedAccessToken;

    // Live token PEHLE (GmbConnection se, resolvedUserId ke against). AutomationPlan
    // par stored refreshToken ek snapshot hai — agar user settings save karne ke BAAD
    // GMB reconnect kar le, Google naya refresh token deta hai aur purana revoke ho
    // jata hai. Tab snapshot invalid_grant se fail hoke automation chup-chaap ruk
    // jati. Live token us reconnect ko survive karta hai; snapshot fallback rehta hai.
    let effectiveRefreshToken = storedRefreshToken;
    if (wantGmb) {
      try {
        const conn = await getGmbConnection(resolvedUserId);
        if (conn?.refreshToken && !conn.invalid) {
          effectiveRefreshToken = conn.refreshToken;
          log('Using live refreshToken from GmbConnection (survives reconnect).');
        }
      } catch (connErr) {
        log(`⚠ GmbConnection lookup failed, using AutomationPlan snapshot: ${connErr.message}`);
      }
    }

    console.log('[CRON] 🔑 Stored accessToken length:', storedAccessToken?.length || 0);
    console.log('[CRON] 🔑 Effective refreshToken length:', effectiveRefreshToken?.length || 0);

    if (wantGmb) {
      // ALWAYS refresh when a refreshToken exists. Google access tokens expire in
      // ~1h, so the stored token is almost always stale. Diagnostic proved the
      // stale token creates the post but the PHOTO upload fails ("Photo gallery
      // upload failed") — a fresh token fixes it. Fall back to stored on failure.
      if (effectiveRefreshToken) {
        log('Refreshing Google access token (proactive — stored token is likely expired)…');
        try {
          accessToken = await refreshGoogleToken(effectiveRefreshToken, planId);
          log(`✓ Fresh access token obtained via refresh (length=${accessToken.length})`);
        } catch (tokenErr) {
          log(`⚠ Token refresh failed: ${tokenErr.message} — falling back to stored token (may be expired)`);
          accessToken = storedAccessToken;
        }
      } else if (accessToken) {
        log(`✓ Using stored accessToken (no refreshToken to refresh with, length=${accessToken.length})`);
      } else {
        log(`⚠ No accessToken and no refreshToken — re-save user-settings to fix`);
      }
    }

    // ── 4. Pick keyword + city ────────────────────────────────────────────────
    const keywordSlot = postIndex % keywords.length;
    const keyword     = keywords[keywordSlot];
    const loc0        = locations[0];
    const cityName    = loc0?.locality || loc0?.name || businessName || '';
    log(`Keyword slot ${keywordSlot + 1}/${keywords.length} (postIndex=${postIndex}): "${keyword}"  city: "${cityName}"`);

    let imageUrl;
    let postText;
    let descriptions;
    let usedPrefetch = false;

    if (hasPrefetchForToday) {
      usedPrefetch = true;
      imageUrl = prefetchPost.imageUrl;
      postText = prefetchPost.postText;
      descriptions = prefetchPost.descriptions;
      slog.pass('content:prefetch', `using prefetched bundle keyword="${prefetchPost.keyword || keyword}"`);
      log('Publish flow — using AutomationPlan.prefetchPost', {
        keyword: prefetchPost.keyword,
        publishOnYmd: prefetchPost.publishOn ? zonedYmdString(prefetchPost.publishOn, tz) : null,
        imageUrlPreview: String(prefetchPost.imageUrl || '').slice(0, 160),
        postTextPreview: String(prefetchPost.postText || '').slice(0, 200),
      });
    } else {
      if (
        prefetchPost?.publishOn &&
        zonedYmdString(prefetchPost.publishOn, tz) < zonedYmdString(runNow, tz)
      ) {
        await AutomationPlan.updateOne({ _id: planId }, { $unset: { prefetchPost: 1 } });
        log('Removed stale prefetch (missed publish day)');
      }
      try {
        const imagePrompt = await generateImagePrompt({ keyword, businessName, cityName });
        log(`Image prompt: "${imagePrompt}"`);
        ({ imageUrl, postText, descriptions } = await generateImageAndText({ imagePrompt, keyword, businessName, cityName, imageConfig, platforms: platformsSafe }));
        log(`Image URL: ${imageUrl || '⚠ NULL — n8n returned no image URL'}`);
        log(`Post text: "${postText}"`);
        slog.pass('content:generate', `inline generate keyword="${keyword}" image=${imageUrl ? 'ok' : 'NULL'} text=${postText ? 'ok' : 'NULL'}`);
      } catch (genErr) {
        // generateImage/Text normally swallow their own errors; this catch is a
        // safety net so a throw doesn't crash the whole run. The empty-bundle
        // gate below turns missing image/text into a clean per-plan failure.
        slog.fail('content:generate', `inline generation threw for keyword="${keyword}"`, genErr);
        log(`⚠ Inline generation threw: ${genErr.message}`);
      }
    }

    const imgTrim = String(imageUrl || '').trim();
    const txtTrim = String(postText || '').trim();
    if (!imgTrim || !txtTrim) {
      log(
        `FAIL — empty publish bundle (safety gate). imageChars=${imgTrim.length} captionChars=${txtTrim.length} usedPrefetch=${usedPrefetch}`
      );
      slog.fail('content:empty-bundle', `empty image/caption (imageChars=${imgTrim.length} captionChars=${txtTrim.length}) — check aiAssetsGenerate / OPENAI_API_KEY`);
      results.errors.push({
        planId: planId.toString(),
        userId,
        error: 'Empty image URL or caption — abort before PostStatus create',
      });
      results.failed++;
      continue;
    }
    imageUrl = imgTrim;
    postText = txtTrim;

    if (wantGmb) {
      const tok = String(accessToken || '').trim();
      if (tok.length < 30) {
        log(
          `FAIL — GMB accessToken invalid or missing before publish (trimmedLen=${tok.length}). Refresh failed or tokens not stored on AutomationPlan.`
        );
        slog.fail('token:invalid', `GMB access token invalid/missing (len=${tok.length}) — re-save user-settings or refreshToken expired`);
        results.errors.push({
          planId: planId.toString(),
          userId,
          error: 'Invalid Google access token — cannot publish',
        });
        results.failed++;
        continue;
      }
    }

    // ── 8. Save to DB as "pending" ────────────────────────────────────────────
    // Payload mirrors savePostAction so the post appears in the dashboard.
    const locationsForDB = wantGmb
      ? locations.map((loc) => ({
          locationId: loc.locationId || '',
          accountId:  loc.accountId  || '',
          name:       loc.name       || loc.locality || '',
          address:    loc.address    || '',
          locality:   loc.locality   || '',
          websiteUrl: loc.websiteUrl || '',
          isPosted:   false,
        }))
      : [];

    const savePayload = {
      userId:              resolvedUserId,  // matches localStorage → shows in dashboard
      aiOutput:            imageUrl || '',  // same as data.image || data.output in savePostAction
      description:         postText,
      gmbDescription:      descriptions?.gmb || postText,
      fbDescription:       descriptions?.fb || postText,
      igDescription:       descriptions?.ig || postText,
      piDescription:       descriptions?.pin || postText,
      ...(descriptions?.pinTitle ? { pinTitle: descriptions.pinTitle } : {}),
      promat:              usedPrefetch && prefetchPost?.keyword ? prefetchPost.keyword : keyword,
      status:              'pending',
      scheduledDateSource: [...platformsSafe],
      scheduledDate:       new Date(),
      accessToken,
      checkmark:           'post',
      locations:           locationsForDB,
      whenPosted:          {},
    };

    console.log('[CRON] 💾 Saving PostStatus — payload:', JSON.stringify({
      userId:       savePayload.userId,
      aiOutput:     savePayload.aiOutput?.slice(0, 80),
      description:  savePayload.description,
      status:       savePayload.status,
      locationsCount: savePayload.locations.length,
      locations:    savePayload.locations,
    }, null, 2));

    let savedPostId = null;
    try {
      const saved = await Post.create(savePayload);
      savedPostId = saved._id;
      slog.setPostId(savedPostId);
      slog.pass('db:post-created', `PostStatus created _id=${savedPostId} status=pending`);
      log(`✓ PostStatus created — _id=${savedPostId}  userId=${resolvedUserId}  status=pending`);

      // Verify save was successful
      const verify = await Post.findById(savedPostId).lean().select('_id userId status aiOutput');
      console.log('[CRON] 💾 DB verify:', JSON.stringify(verify));
    } catch (saveErr) {
      console.error('[CRON] ❌ Post.create() FAILED:', saveErr.message);
      console.error('[CRON] ❌ Error details:', JSON.stringify(saveErr.errors || {}));
      slog.fail('db:post-save', `PostStatus save failed (code=${saveErr.code})`, saveErr);
      log(`✗ PostStatus save FAILED: ${saveErr.message}  code=${saveErr.code}`);
      // Continue — still try to post to GMB even if DB save failed
    }

    // ── 9. Post to GMB (skip if dryRun) ──────────────────────────────────────
    const account      = loc0?.accountId || gmbProjectId || '';
    const locationData = locations.map((loc) => ({
      city:     loc.locationId,
      cityName: loc.locality || loc.name || '',
      bookUrl:  loc.websiteUrl || '',
      account:  loc.accountId || account,
    }));

    if (dryRun) {
      slog.success('dryrun', `dryRun — image+text generated & saved pending _id=${savedPostId}; live posts skipped`);
      log(`⏭ dryRun=1 — live posts SKIPPED. Post saved as "pending" _id=${savedPostId}`);
      results.successful++;
      continue;
    }

    let gmbResult = { ok: !wantGmb, httpStatus: 200, data: {} };

    if (wantGmb) {
      log(`Posting to GMB — account=${account}  locations=${locations.length}  tokenLen=${accessToken?.length || 0}`);

      // Retry loop: the upstream photo step ("Photo gallery upload failed") is
      // intermittent — the same payload succeeds on one run and fails the next.
      // Retry a few times; on an auth error refresh the token before retrying.
      const MAX_GMB_ATTEMPTS = Math.max(1, Number(process.env.AUTOMATION_GMB_RETRIES) || 3);
      const GMB_RETRY_DELAY_MS = Math.max(1000, Number(process.env.AUTOMATION_GMB_RETRY_DELAY_MS) || 4000);

      for (let attempt = 1; attempt <= MAX_GMB_ATTEMPTS; attempt++) {
        gmbResult = await postToGmb({ account, locationData, imageUrl, description: postText, accessToken, postId: savedPostId, userId: resolvedUserId }, log);

        log(`GMB attempt ${attempt}/${MAX_GMB_ATTEMPTS}`, {
          ok: gmbResult.ok,
          httpStatus: gmbResult.httpStatus,
          authError: gmbResult.authError,
          succeeded: gmbResult.succeeded,
          failed: gmbResult.failed,
          parsedResponse: gmbResult.data,
          rawBodyPreview: String(gmbResult.rawBody || '').slice(0, 4000),
        });

        if (gmbResult.ok) break;

        // Auth failure → refresh token before the next attempt.
        if ((gmbResult.authError || [401, 403].includes(gmbResult.httpStatus)) && effectiveRefreshToken) {
          log(`⚠ Google auth rejected (httpStatus=${gmbResult.httpStatus}) — refreshing token before retry…`);
          try {
            accessToken = await refreshGoogleToken(effectiveRefreshToken, planId);
            log(`✓ New accessToken obtained (length=${accessToken.length})`);
          } catch (refreshErr) {
            log(`✗ Token refresh failed: ${refreshErr.message}`);
          }
        }

        if (attempt < MAX_GMB_ATTEMPTS) {
          log(`↻ Retrying GMB post in ${GMB_RETRY_DELAY_MS}ms (transient failure — e.g. Photo gallery upload)…`);
          await new Promise((r) => setTimeout(r, GMB_RETRY_DELAY_MS));
        }
      }

      if (!gmbResult.ok) {
        log(`✗ GMB post FAILED after all attempts`);
        slog.fail('publish:gmb', `GMB post failed (httpStatus=${gmbResult.httpStatus} authError=${gmbResult.authError} succeeded=${gmbResult.succeeded} failed=${gmbResult.failed})`, JSON.stringify(gmbResult.data).slice(0, 500));
        if (savedPostId) {
          try {
            await Post.findByIdAndUpdate(savedPostId, { $set: { status: 'failed' } });
            log(`PostStatus marked as "failed" — _id=${savedPostId}`);
          } catch (e) {
            console.error('[CRON] ❌ Could not mark post as failed:', e.message);
          }
        }
        results.errors.push({
          planId:       planId.toString(),
          userId,
          resolvedUserId,
          savedPostId:  savedPostId?.toString(),
          httpStatus:   gmbResult.httpStatus,
          error:        `GMB post failed: ${JSON.stringify(gmbResult.data).slice(0, 300)}`,
        });
        results.failed++;
        continue;
      }

      slog.pass('publish:gmb', `GMB post successful (succeeded=${gmbResult.succeeded} locations=${locations.length})`);
      log(`✓ GMB post SUCCESSFUL`);
    } else {
      slog.info('publish:gmb', 'GMB skipped — not selected in platforms');
      log('GMB skipped — not selected in platforms');
    }

    let fbResults = [];
    let igResults = [];

    if (wantFb) {
      fbResults = await postToFacebookPages({
        userId:   resolvedUserId,
        fbPages,
        caption:  descriptions?.fb || postText,
        imageUrl,
      });
      log(`Facebook: ${JSON.stringify(fbResults)}`);
      const fbOk = fbResults.filter((r) => r.success).length;
      const fbErr = fbResults.find((r) => !r.success)?.error;
      if (fbOk > 0 && !fbErr) slog.pass('publish:fb', `Facebook posted to ${fbOk}/${fbResults.length} page(s)`);
      else slog.fail('publish:fb', `Facebook posted ${fbOk}/${fbResults.length} page(s)`, fbErr);
    }
    if (wantIg) {
      igResults = await postToInstagramAccounts({
        userId:   resolvedUserId,
        igPages,
        caption:  descriptions?.ig || postText,
        imageUrl,
      });
      log(`Instagram: ${JSON.stringify(igResults)}`);
      const igOk = igResults.filter((r) => r.success).length;
      const igErr = igResults.find((r) => !r.success)?.error;
      if (igOk > 0 && !igErr) slog.pass('publish:ig', `Instagram posted to ${igOk}/${igResults.length} account(s)`);
      else slog.fail('publish:ig', `Instagram posted ${igOk}/${igResults.length} account(s)`, igErr);
    }

    const gmbPosted = wantGmb && gmbResult.ok;
    const fbPosted  = wantFb && fbResults.some((r) => r.success);
    const igPosted  = wantIg && igResults.some((r) => r.success);

    const platformsPosted = [
      ...(gmbPosted ? ['gmb'] : []),
      ...(fbPosted ? ['fb'] : []),
      ...(igPosted ? ['ig'] : []),
    ];

    const overallOk =
      (!wantGmb || gmbPosted) &&
      (!wantFb  || fbPosted) &&
      (!wantIg  || igPosted);

    if (!overallOk) {
      log(`✗ One or more selected platforms did not post — platformsPosted=${JSON.stringify(platformsPosted)}`);
      slog.fail('publish:partial', `not all selected platforms posted — posted=${JSON.stringify(platformsPosted)} wanted=${JSON.stringify(platformsSafe)}`);
      if (savedPostId) {
        try {
          await Post.findByIdAndUpdate(savedPostId, { $set: { status: 'failed' } });
        } catch (e) {
          console.error('[CRON] ❌ Could not mark post as failed:', e.message);
        }
      }
      results.errors.push({
        planId: planId.toString(),
        userId,
        error: 'Partial or full platform failure',
        platformsPosted,
      });
      results.failed++;
      continue;
    }

    const whenPosted = {
      ...(gmbPosted ? { gmb: new Date().toISOString() } : {}),
      ...(fbPosted ? { fb: new Date().toISOString() } : {}),
      ...(igPosted ? { ig: new Date().toISOString() } : {}),
    };

    const fbPagesForDb = (fbPages || []).map((p) => ({
      ...p,
      isPosted: fbResults.find((r) => r.pageId === p.pageId)?.success ?? false,
    }));
    const igPagesForDb = (igPages || []).map((a) => ({
      ...a,
      isPosted: igResults.find((r) => r.igId === a.igId)?.success ?? false,
    }));

    // ── 10. Update PostStatus to "posted" ────────────────────────────────────
    if (savedPostId) {
      try {
        await Post.findByIdAndUpdate(savedPostId, {
          $set: {
            status:              'posted',
            scheduledDateSource: platformsPosted,
            fbDescription:       descriptions?.fb || postText,
            igDescription:       descriptions?.ig || postText,
            whenPosted,
            fbPages:             wantFb ? fbPagesForDb : [],
            igPages:             wantIg ? igPagesForDb : [],
            locations: wantGmb
              ? locationsForDB.map((loc) => ({
                  ...loc,
                  isPosted: true,
                  postedAt: new Date(),
                }))
              : locationsForDB,
          },
        });
        log(`✓ PostStatus updated to "posted" — _id=${savedPostId} platforms=${JSON.stringify(platformsPosted)}`);
      } catch (updateErr) {
        console.error('[CRON] ❌ PostStatus update failed:', updateErr.message);
        log(`⚠ PostStatus update failed: ${updateErr.message}`);
      }
    }

    // ── 11. Update AutomationPlan counters ────────────────────────────────────
    // Daily WhatsApp notification to the same user's account number after post is ready.
    try {
      const notifyUser = await resolvePlanUser(userRef, userId, 'fullName phone mobileNumber');
      const destination = normalizeIndiaPhone(notifyUser?.phone || notifyUser?.mobileNumber);
      if (destination) {
        const nameParts = String(notifyUser?.fullName || 'User').trim().split(/\s+/);
        const waResult = await sendDailyPostUpdateWhatsApp({
          destination,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          postContent: postText,
          imageUrl,
        });

        if (waResult.ok) {
          log(`✓ Daily post WhatsApp sent to ${destination}`);
          slog.pass('notify:whatsapp', `daily_post_update sent to ${destination}`);
        } else {
          log(`⚠ Daily post WhatsApp failed for ${destination}: ${waResult.error}`);
          slog.fail('notify:whatsapp', `daily_post_update failed for ${destination}`, waResult.error);
        }
      } else {
        log('⚠ Daily post WhatsApp skipped — user phone not found/invalid');
        slog.skip('notify:whatsapp', 'user phone missing or invalid');
      }
    } catch (waErr) {
      log(`⚠ Daily post WhatsApp exception: ${waErr.message}`);
      slog.fail('notify:whatsapp', 'exception while sending daily_post_update', waErr.message);
    }

    const newUsed      = postsUsed + 1;
    const newRemaining = Math.max(0, limit - newUsed);

    await AutomationPlan.updateOne(
      { _id: planId },
      {
        $set: {
          lastPostDate:            new Date(),
          postIndex:               postIndex + 1,
          'planDetails.postsUsed': newUsed,
          'planDetails.remaining': newRemaining,
        },
        $unset: { prefetchPost: 1 },
      }
    );
    log(`Plan counters updated — nextIndex=${postIndex + 1}  postsUsed=${newUsed}/${limit}`);

    // Keep User.postsUsed in sync
    try {
      await User.updateOne(
        { $or: [{ userId: resolvedUserId }, ...(userRef ? [{ _id: userRef }] : [])] },
        { $inc: { postsUsed: 1 } }
      );
    } catch (e) {
      console.warn('[CRON] ⚠ User.postsUsed increment non-fatal:', e.message);
    }

    slog.success('done', `posted to [${platformsPosted.join(',')}] postId=${savedPostId} postsUsed=${newUsed}/${limit}`);
    results.successful++;
    log(`✅ Done — postId=${savedPostId}  resolvedUserId=${resolvedUserId}  nextIndex=${postIndex + 1}`);
  }

  const logSave = await run.flush();

  console.log('\n[CRON] ═══════════════════════════════════════════════════════');
  console.log('[CRON] Run complete:', JSON.stringify(results, null, 2));
  log('Run complete', results);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    runId: run.runId,
    automationLogsSaved: logSave.saved,
    force: forceRun,
    dryRun,
    manualTrigger: manualTriggerEffective,
    testNow: cronParams.testNow,
    phaseAtCompletion: phase,
    ...results,
    logs,
  });
}
