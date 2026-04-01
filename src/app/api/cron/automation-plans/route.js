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
 *   ?force=1     — bypass "already posted today" guard
 *   ?dryRun=1    — generate image + text, save as "pending", skip actual GMB post
 *   ?phase=prefetch — only pre-generate image+copy for *tomorrow* (run 1–2h after
 *                    today’s publish). Publish phase uses it when dates match.
 *
 * ?phase=dailyAutomation — runs publish then prefetch in one call (legacy single cron).
 * ?phase=tick — publish then prefetch; use with a cron every 10 minutes so chosen hour:minute (IST) is honored.
 * ?phase=manual&userId=USR_… — Postman/on-demand: same publish pipeline (image + GMB post) for one user.
 *   Requires Authorization: Bearer CRON_SECRET when env CRON_SECRET is set.
 *   Validates start/end, frequency/schedule day, quota, locations — skips clock window only.
 * postingHour / postingMinute gate scheduled cron; prefetch runs 24h before (prefetchOffsetMinutes, default 1440).
 */

import { NextResponse } from 'next/server';
import dbConnect        from '@/lib/dbConnect';
import User             from '@/models/User';
import Post             from '@/models/PostStatus';
import AutomationPlan   from '@/models/AutomationPlan';
import { getPlanPostLimit } from '@/utils/userSettingsHelpers';
import {
  matchesPostingWindow,
  matchesAbsoluteWindow,
  matchesPrefetchAbsoluteWindow,
  zonedYmdString,
} from '@/utils/postingScheduleWindow';
import {
  getNextPublishDateRef,
  isPostingDayTodayZoned,
  getPublishUtcMsForDateRef,
  sameZonedDay,
} from '@/utils/automationPlanSchedule';

export const dynamic     = 'force-dynamic';
export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const CRON_TIME_TOLERANCE_MIN = Math.min(
  60,
  Math.max(5, Number(process.env.AUTOMATION_CRON_TOLERANCE_MINUTES) || 15)
);

/** Strip disabled asset slots before calling aiAssetsGenerate */
function applyIncludeInGeneration(imageConfig = {}) {
  const inc = imageConfig.includeInGeneration || {};
  const next = { ...imageConfig };
  for (const k of ['characterImage', 'uniformImage', 'productImage', 'backgroundImage', 'logoImage']) {
    if (inc[k] === false) next[k] = null;
  }
  return next;
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

// ─── GPT helper ───────────────────────────────────────────────────────────────

async function callGpt(systemPrompt, userPrompt, maxTokens = 400) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[CRON] ⚠ OPENAI_API_KEY not set — GPT call skipped');
    return null;
  }
  try {
    const res  = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens:  maxTokens,
      }),
    });
    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('[CRON] 🤖 GPT raw:', raw.slice(0, 250));
    return JSON.parse(raw.replace(/^```(?:json)?|```$/gm, '').trim());
  } catch (err) {
    console.error('[CRON] ❌ GPT error:', err.message);
    return null;
  }
}

// ─── Image generation ─────────────────────────────────────────────────────────

async function generateImagePrompt({ keyword, businessName, cityName }) {
  const fallback = `${keyword} — ${businessName}${cityName ? ', ' + cityName : ''}`;
  const result = await callGpt(
    'You are a creative director for an AI image generation tool. Return ONLY compact JSON.',
    `Business: "${businessName}"
Keyword: "${keyword}"
Create a vivid, specific image-generation prompt (max 120 chars) for a professional GMB post image.
Return ONLY: {"prompt":"..."}`,
    200
  );
  const prompt = result?.prompt || fallback;
  console.log('[CRON] 📝 Image prompt:', prompt);
  return prompt;
}

async function generateImage({ imagePrompt, keyword, businessName, imageConfig = {} }) {
  const cfg = applyIncludeInGeneration(imageConfig);
  const cleanB64 = (s) =>
    typeof s === 'string' && s.startsWith('data:image') ? s.split(',')[1] : s || '';

  const payload = {
    topic:           imagePrompt || keyword || '',
    bussiness_name:  businessName || '',
    keywords:        keyword || '',
    colourPalette:   cfg.colourPalette || '',
    size:            cfg.size || '3:4',
    characterImage:  cleanB64(cfg.characterImage),
    uniformImage:    cleanB64(cfg.uniformImage),
    productImage:    cleanB64(cfg.productImage),
    backgroundImage: cleanB64(cfg.backgroundImage),
    logoImage:       cleanB64(cfg.logoImage),
    platform:        'gmb',
  };

  console.log('[CRON] 🖼  Calling aiAssetsGenerate —', BASE_URL + '/api/aiAssetsGenerate');
  console.log('[CRON] 🖼  Payload:', JSON.stringify({
    topic: payload.topic,
    bussiness_name: payload.bussiness_name,
    keywords: payload.keywords,
    colourPalette: payload.colourPalette,
    size: payload.size,
  }));

  try {
    const res  = await fetch(`${BASE_URL}/api/aiAssetsGenerate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    console.log('[CRON] 🖼  aiAssetsGenerate HTTP status:', res.status);

    const json = await res.json();
    console.log('[CRON] 🖼  aiAssetsGenerate full response:', JSON.stringify(json).slice(0, 600));

    // Response shape: { success: true, data: { imageUrl/url/image/output/... } }
    const d = json?.data;
    const imageUrl =
      d?.imageUrl || d?.url || d?.image || d?.output ||
      (Array.isArray(d) ? (d[0]?.imageUrl || d[0]?.url || d[0]?.image) : null) ||
      null;

    console.log('[CRON] 🖼  Extracted imageUrl:', imageUrl);
    return imageUrl;
  } catch (err) {
    console.error('[CRON] ❌ generateImage EXCEPTION:', err.message);
    return null;
  }
}

// ─── Post text generation ─────────────────────────────────────────────────────

async function generatePostText({ businessName, keyword, cityName }) {
  const fallback = `${keyword} | ${businessName}${cityName ? ' — ' + cityName : ''}`;
  const result = await callGpt(
    'Expert GMB copywriter. Respond with ONLY compact JSON.',
    `Write a Google My Business post for:
Business: "${businessName}"
Keyword: "${keyword}"
City: "${cityName || ''}"
Rules: max 150 chars total, use actual city name (never {{city}}), energetic, 1-2 emojis, 2-3 hashtags.
Return ONLY: {"text":"...","hashtags":["#a","#b"]}`,
    300
  );

  if (!result?.text) return fallback;
  const hashtags = Array.isArray(result.hashtags) ? result.hashtags : [];
  const postText = `${result.text} ${hashtags.join(' ')}`.trim();
  console.log('[CRON] ✍️  Post text:', postText);
  return postText;
}

// ─── GMB posting ──────────────────────────────────────────────────────────────

/**
 * Calls /api/post-to-gmb with the EXACT same payload the manual frontend sends:
 *   account, locationData, output, description, accessToken, checkmark
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
    checkmark:   'post',
  };

  console.log('[CRON] 📮 postToGmb payload (exact same as manual post):', JSON.stringify({
    account,
    locationDataCount: locationData?.length,
    locationData,
    output:         payload.output?.slice(0, 100),
    description:    description,
    checkmark:      'post',
    accessTokenLen: accessToken?.length || 0,
  }, null, 2));

  try {
    const res  = await fetch(`${BASE_URL}/api/post-to-gmb`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    console.log('[CRON] 📮 post-to-gmb HTTP status:', res.status);

    const text = await res.text();
    console.log('[CRON] 📮 post-to-gmb raw response:', text.slice(0, 600));

    let data;
    try   { data = text ? JSON.parse(text) : {}; }
    catch { data = { raw: text }; }

    return { ok: res.ok && data?.ok !== false, httpStatus: res.status, data };
  } catch (err) {
    console.error('[CRON] ❌ postToGmb EXCEPTION:', err.message);
    return { ok: false, httpStatus: 500, data: err.message };
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
  console.log('\n[CRON] ═══════════════════════════════════════════════════════');
  console.log('[CRON] automation-plans cron START —', new Date().toISOString());
  console.log('[CRON] BASE_URL:', BASE_URL);

  const { searchParams } = new URL(request.url);
  const forceRun = searchParams.get('force')  === '1';
  const dryRun   = searchParams.get('dryRun') === '1';
  let phase      = searchParams.get('phase')  || 'publish';
  console.log(`[CRON] Params — force=${forceRun}  dryRun=${dryRun}  phase=${phase}`);

  if (phase === 'dailyAutomation' || phase === 'tick') {
    const origin = new URL(request.url);
    origin.searchParams.set('phase', 'publish');
    const publishRes = await GET(new Request(origin.toString(), { headers: request.headers }));
    origin.searchParams.set('phase', 'prefetch');
    const prefetchRes = await GET(new Request(origin.toString(), { headers: request.headers }));
    const publishJson = await publishRes.json();
    const prefetchJson = await prefetchRes.json();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      phase,
      publish: publishJson,
      prefetch: prefetchJson,
    });
  }

  await dbConnect();
  console.log('[CRON] ✓ DB connected');

  const logs = [];
  const log  = (msg, extra) => {
    const line = extra !== undefined ? `${msg} | ${JSON.stringify(extra)}` : msg;
    logs.push(line);
    console.log('[CRON]', line);
  };

  log(`Starting — phase=${phase} force=${forceRun} dryRun=${dryRun} — ${new Date().toISOString()}`);

  let skipPublishClockWindow = false;
  let activePlans;

  if (phase === 'manual') {
    const manualUserId = searchParams.get('userId')?.trim();
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
    }).lean();
    if (!one) {
      return NextResponse.json(
        { error: 'No active automation plan for this userId', userId: manualUserId },
        { status: 404 }
      );
    }
    activePlans = [one];
    skipPublishClockWindow = true;
    phase = 'publish';
    log(`Manual trigger for userId=${manualUserId} — schedule/frequency/start/end enforced; clock window skipped`);
  } else {
    activePlans = await AutomationPlan.find({
      active:            true,
      automationEnabled: true,
    }).lean();
  }

  log(`Found ${activePlans.length} active plan(s)`);
  console.log('[CRON] Plan IDs:', activePlans.map(p => p._id.toString()));

  // ── PREFETCH PHASE: generate image+copy prefetchOffsetMinutes before publish (default 24h) ──
  if (phase === 'prefetch') {
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
        log(`[prefetch] Skip — outside prefetch window (offset=${plan.prefetchOffsetMinutes ?? 1440}m, tol=${CRON_TIME_TOLERANCE_MIN}m)`);
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
        prefetchStats.skipped++; continue;
      }

      if (!keywords.length) {
        log('Prefetch skip — no keywords');
        prefetchStats.skipped++; continue;
      }

      if (plan.endDate && zonedYmdString(nextRef, tz) > zonedYmdString(plan.endDate, tz)) {
        log('Prefetch skip — next publish after plan end date');
        prefetchStats.skipped++; continue;
      }

      const pf = plan.prefetchPost;
      if (pf?.imageUrl && pf?.postText && pf?.publishOn && sameZonedDay(pf.publishOn, nextRef, tz)) {
        log('Prefetch skip — bundle already stored for that publish day');
        prefetchStats.skipped++; continue;
      }

      const keyword  = keywords[postIndex % keywords.length];
      const loc0     = (plan.locations || [])[0];
      const cityName = loc0?.locality || loc0?.name || plan.businessName || '';

      try {
        const imagePrompt = await generateImagePrompt({ keyword, businessName: plan.businessName || '', cityName });
        const imageUrl    = await generateImage({ imagePrompt, keyword, businessName: plan.businessName || '', imageConfig: plan.imageConfig || {} });
        const postText    = await generatePostText({ businessName: plan.businessName || '', keyword, cityName });
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
                publishOn:   nextRef,
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

    log('Prefetch phase complete', prefetchStats);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      baseUrl:   BASE_URL,
      phase:     'prefetch',
      ...prefetchStats,
      logs,
    });
  }

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
    if (!limit && userRef) {
      const u = await User.findById(userRef).select('paidPackage planDuration packageExpiryDate').lean();
      if (u) {
        const computed = getPlanPostLimit(u.paidPackage, u.planDuration);
        if (computed > 0) {
          limit = computed;
          log(`Hydrated planDetails.limit=${limit} from User package`);
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

    if (endDate && zonedYmdString(runNow, tz) > zonedYmdString(endDate, tz)) {
      log(`Skip — end date passed: ${endDate}`);
      await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
      results.skipped++; continue;
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

      if (lastPostDate && zonedYmdString(lastPostDate, tz) === zonedYmdString(runNow, tz)) {
        log(`Skip — already posted today. lastPostDate=${lastPostDate}  (add ?force=1 to override)`);
        results.skipped++; continue;
      }

      if (!skipPublishClockWindow) {
        const ph = plan.postingHour;
        const hasHour = ph != null && ph !== '' && !Number.isNaN(Number(ph));
        if (hasHour) {
          const publishMs = getPublishUtcMsForDateRef(plan, runNow);
          if (publishMs == null || !matchesAbsoluteWindow(runNow, publishMs, CRON_TIME_TOLERANCE_MIN)) {
            log(`Skip — outside publish clock window (${plan.postingHour}:${String(plan.postingMinute ?? 0).padStart(2, '0')} ${tz}, tol=${CRON_TIME_TOLERANCE_MIN}m)`);
            results.skipped++; continue;
          }
        } else if (!matchesPostingWindow(plan, runNow)) {
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

    if (
      prefetchPost?.imageUrl &&
      prefetchPost?.postText &&
      prefetchPost?.publishOn &&
      sameZonedDay(prefetchPost.publishOn, runNow, tz)
    ) {
      usedPrefetch = true;
      imageUrl = prefetchPost.imageUrl;
      postText = prefetchPost.postText;
      log('Using prefetched image + copy for today’s publish');
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

      console.log('[CRON] 📮 gmbResult attempt-1:', JSON.stringify(gmbResult));
      log(`GMB attempt 1 — ok=${gmbResult.ok}  httpStatus=${gmbResult.httpStatus}  data=${JSON.stringify(gmbResult.data).slice(0, 300)}`);

      if (!gmbResult.ok && [401, 403].includes(gmbResult.httpStatus) && storedRefreshToken) {
        log(`⚠ Token expired (HTTP ${gmbResult.httpStatus}) — refreshing using refreshToken and retrying…`);
        try {
          accessToken = await refreshGoogleToken(storedRefreshToken, planId);
          log(`✓ New accessToken obtained (length=${accessToken.length}) — retrying GMB post`);

          gmbResult = await postToGmb({ account, locationData, imageUrl, description: postText, accessToken });

          console.log('[CRON] 📮 gmbResult retry:', JSON.stringify(gmbResult));
          log(`GMB retry — ok=${gmbResult.ok}  httpStatus=${gmbResult.httpStatus}  data=${JSON.stringify(gmbResult.data).slice(0, 300)}`);
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
    baseUrl:   BASE_URL,
    ...results,
    logs,
    manualTrigger: skipPublishClockWindow,
  });
}
