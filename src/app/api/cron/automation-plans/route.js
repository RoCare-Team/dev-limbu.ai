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
  generateImage,
  generatePostText,
} from '@/lib/automationPlanContentGeneration';
import {
  parseAutomationCronParams,
  effectivePlanForPostingClock,
} from '@/lib/automationCronQueryParams';

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

/**
 * Calls /api/gmb/publish — the SAME working endpoint the manual frontend uses
 * (postToGmbAction). The legacy /api/post-to-gmb path pointed at a dead n8n
 * webhook whose host no longer resolves, which is why cron posts failed with
 * "fetch failed". Payload shape matches the manual post:
 *   account, locationData, output, description, accessToken, checkmark
 * `skipDbUpdate` is set because this cron manages PostStatus itself.
 * Returns { ok, httpStatus, data }
 */
async function postToGmb({ account, locationData, imageUrl, description, accessToken }) {
  // ── Build payload identical to the manual post ───────────────────────────
  const payload = {
    account,
    locationData,          // [{ city: locationId, cityName: locality, bookUrl: websiteUrl }]
    output:      imageUrl || '',
    description,
    accessToken: accessToken || '',
    // 'both' = publish the post text AND attach the image. 'post' alone is a
    // text-only update (no photo) — that's why GMB returned photo_media_id:null.
    checkmark:   'both',
    skipDbUpdate: true,
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

  try {
    const res  = await fetch(`${BASE_URL}/api/gmb/publish`, {
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
    // HTTP 200 with a non-empty `fail` list (e.g. expired OAuth token) is NOT a real success,
    // so inspect the per-location results instead of trusting the outer ok flag.
    const publishData = data && typeof data.data === 'object' && data.data ? data.data : {};
    const successList = Array.isArray(publishData.success) ? publishData.success : [];
    const failList = Array.isArray(publishData.fail) ? publishData.fail : [];
    const succeeded = Number(publishData.succeeded) || successList.length;
    const failed = Number(publishData.failed) || failList.length;
    const httpOk = res.ok && data?.ok !== false;
    const hasFailures = failed > 0;
    const hasSuccess = succeeded > 0;
    // Real success: transport ok, no failures, and either an explicit success or no per-location lists at all.
    const reallyOk =
      httpOk && !hasFailures && (hasSuccess || (successList.length === 0 && failList.length === 0));

    const failMessages = failList
      .map((f) => String(f?.error || f?.message || ''))
      .join(' | ');
    const authError =
      [401, 403].includes(res.status) ||
      /invalid authentication|unauthenticated|oauth 2|invalid_grant|access token|login cookie|permission/i.test(
        failMessages
      );

    return {
      ok: reallyOk,
      httpStatus: res.status,
      authError,
      succeeded,
      failed,
      data,
      rawBody: text,
    };
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
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const auth = request.headers.get('authorization');
      if (auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized — set Authorization: Bearer CRON_SECRET' }, { status: 401 });
      }
    }
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
      let pkgExp = null;
      const uPkg = await resolvePlanUser(userRef, userId, 'packageExpiryDate');
      if (uPkg?.packageExpiryDate) pkgExp = new Date(uPkg.packageExpiryDate);
      if (pkgExp && pkgExp.getTime() > runNow.getTime()) {
        await AutomationPlan.updateOne({ _id: planId }, { $set: { endDate: pkgExp } });
        plan.endDate = pkgExp;
        log(`Extended endDate to package expiry (${pkgExp.toISOString()}) — plan end was stale`);
      } else {
        log(`Skip — end date passed: ${endDate}`);
        await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
        results.skipped++; continue;
      }
    }

    if (!forceRun) {
      if (startDate && zonedYmdString(runNow, tz) < zonedYmdString(startDate, tz)) {
        log(`Skip — start date not reached yet: ${startDate}`);
        results.skipped++; continue;
      }

      if (!isPostingDayTodayZoned(plan, runNow)) {
        log(`Skip — not a scheduled posting day (frequency/schedule/start/end in ${tz})`);
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
            results.skipped++; continue;
          }
        } else if (!matchesPostingWindow(effectivePlan, runNow)) {
          log(`Skip — outside posting time window (legacy)`);
          results.skipped++; continue;
        }
      }
    }

    if (limit > 0 && postsUsed >= limit) {
      log(`Skip — quota exhausted: ${postsUsed}/${limit}`);
      results.skipped++; continue;
    }

    if (!keywords.length) {
      log(`Skip — no keywords configured in plan`);
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
      results.errors.push({ planId: planId.toString(), userId, error: 'No locations configured for GMB' });
      results.failed++; continue;
    }

    if (!wantGmb && !wantFb && !wantIg) {
      log(`FAIL — no platforms enabled (platforms=${JSON.stringify(platformsSafe)})`);
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

    console.log('[CRON] 🔑 Stored accessToken length:', storedAccessToken?.length || 0);
    console.log('[CRON] 🔑 Stored refreshToken length:', storedRefreshToken?.length || 0);

    if (wantGmb) {
      if (!accessToken && storedRefreshToken) {
        log('No accessToken stored — refreshing using refreshToken…');
        try {
          accessToken = await refreshGoogleToken(storedRefreshToken, planId);
          log(`✓ Access token obtained via refresh (length=${accessToken.length})`);
        } catch (tokenErr) {
          log(`⚠ Token refresh failed: ${tokenErr.message} — will attempt post without token`);
        }
      } else if (accessToken) {
        log(`✓ Using stored accessToken (length=${accessToken.length})`);
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
    let usedPrefetch = false;

    if (hasPrefetchForToday) {
      usedPrefetch = true;
      imageUrl = prefetchPost.imageUrl;
      postText = prefetchPost.postText;
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
      const imagePrompt = await generateImagePrompt({ keyword, businessName, cityName });
      log(`Image prompt: "${imagePrompt}"`);
      imageUrl = await generateImage({ imagePrompt, keyword, businessName, imageConfig });
      log(`Image URL: ${imageUrl || '⚠ NULL — n8n returned no image URL'}`);
      postText = await generatePostText({ businessName, keyword, cityName });
      log(`Post text: "${postText}"`);
    }

    const imgTrim = String(imageUrl || '').trim();
    const txtTrim = String(postText || '').trim();
    if (!imgTrim || !txtTrim) {
      log(
        `FAIL — empty publish bundle (safety gate). imageChars=${imgTrim.length} captionChars=${txtTrim.length} usedPrefetch=${usedPrefetch}`
      );
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
      gmbDescription:      postText,
      fbDescription:       postText,
      igDescription:       postText,
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
      log(`✓ PostStatus created — _id=${savedPostId}  userId=${resolvedUserId}  status=pending`);

      // Verify save was successful
      const verify = await Post.findById(savedPostId).lean().select('_id userId status aiOutput');
      console.log('[CRON] 💾 DB verify:', JSON.stringify(verify));
    } catch (saveErr) {
      console.error('[CRON] ❌ Post.create() FAILED:', saveErr.message);
      console.error('[CRON] ❌ Error details:', JSON.stringify(saveErr.errors || {}));
      log(`✗ PostStatus save FAILED: ${saveErr.message}  code=${saveErr.code}`);
      // Continue — still try to post to GMB even if DB save failed
    }

    // ── 9. Post to GMB (skip if dryRun) ──────────────────────────────────────
    const account      = loc0?.accountId || gmbProjectId || '';
    const locationData = locations.map((loc) => ({
      city:     loc.locationId,
      cityName: loc.locality || loc.name || '',
      bookUrl:  loc.websiteUrl || '',
    }));

    if (dryRun) {
      log(`⏭ dryRun=1 — live posts SKIPPED. Post saved as "pending" _id=${savedPostId}`);
      results.successful++;
      continue;
    }

    let gmbResult = { ok: !wantGmb, httpStatus: 200, data: {} };

    if (wantGmb) {
      log(`Posting to GMB — account=${account}  locations=${locations.length}  tokenLen=${accessToken?.length || 0}`);

      gmbResult = await postToGmb({ account, locationData, imageUrl, description: postText, accessToken });

      log(`GMB attempt 1`, {
        ok: gmbResult.ok,
        httpStatus: gmbResult.httpStatus,
        authError: gmbResult.authError,
        succeeded: gmbResult.succeeded,
        failed: gmbResult.failed,
        parsedResponse: gmbResult.data,
        rawBodyPreview: String(gmbResult.rawBody || '').slice(0, 12000),
      });

      if (!gmbResult.ok && (gmbResult.authError || [401, 403].includes(gmbResult.httpStatus)) && storedRefreshToken) {
        log(`⚠ Google auth rejected (httpStatus=${gmbResult.httpStatus} authError=${gmbResult.authError}) — refreshing using refreshToken and retrying…`);
        try {
          accessToken = await refreshGoogleToken(storedRefreshToken, planId);
          log(`✓ New accessToken obtained (length=${accessToken.length}) — retrying GMB post`);

          gmbResult = await postToGmb({ account, locationData, imageUrl, description: postText, accessToken });

          log(`GMB retry`, {
            ok: gmbResult.ok,
            httpStatus: gmbResult.httpStatus,
            parsedResponse: gmbResult.data,
            rawBodyPreview: String(gmbResult.rawBody || '').slice(0, 12000),
          });
        } catch (refreshErr) {
          log(`✗ Token refresh for retry failed: ${refreshErr.message}`);
        }
      }

      if (!gmbResult.ok) {
        log(`✗ GMB post FAILED after all attempts`);
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

      log(`✓ GMB post SUCCESSFUL`);
    } else {
      log('GMB skipped — not selected in platforms');
    }

    let fbResults = [];
    let igResults = [];

    if (wantFb) {
      fbResults = await postToFacebookPages({
        userId:   resolvedUserId,
        fbPages,
        caption:  postText,
        imageUrl,
      });
      log(`Facebook: ${JSON.stringify(fbResults)}`);
    }
    if (wantIg) {
      igResults = await postToInstagramAccounts({
        userId:   resolvedUserId,
        igPages,
        caption:  postText,
        imageUrl,
      });
      log(`Instagram: ${JSON.stringify(igResults)}`);
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
            fbDescription:       postText,
            igDescription:       postText,
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

    results.successful++;
    log(`✅ Done — postId=${savedPostId}  resolvedUserId=${resolvedUserId}  nextIndex=${postIndex + 1}`);
  }

  console.log('\n[CRON] ═══════════════════════════════════════════════════════');
  console.log('[CRON] Run complete:', JSON.stringify(results, null, 2));
  log('Run complete', results);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    force: forceRun,
    dryRun,
    manualTrigger: manualTriggerEffective,
    testNow: cronParams.testNow,
    phaseAtCompletion: phase,
    ...results,
    logs,
  });
}
