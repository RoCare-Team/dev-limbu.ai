/**
 * GET /api/cron/automation-fill-queue
 *
 * Create-on-generate model. Instead of consuming pre-created empty placeholder
 * Posts, this cron walks the active AutomationPlans (delay_generate_publish mode)
 * and, for each plan whose next slot is due, generates the image + copy and then
 * creates ONE real Post (status=scheduled) — so a Post document never exists
 * without an image. /api/publish-scheduled publishes it at scheduledDate.
 *
 * Env: CRON_SECRET (optional) — require Authorization: Bearer … when set.
 * Run every 5–15 minutes on your host.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/PostStatus';
import AutomationPlan from '@/models/AutomationPlan';
import User from '@/models/User';
import {
  generateImagePrompt,
  generateImageAndText,
} from '@/lib/automationPlanContentGeneration';
import { createRunLogger } from '@/lib/automationRunLogger';
import { sendDailyPostUpdateWhatsApp, normalizeIndiaPhone } from '@/lib/dailyPostWhatsApp';
import { logGenerate, logAutomationLine } from '@/lib/automationFileLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BATCH = 15;                 // max plans processed per run
const DAY_MS = 86400000;
const STALE_LOCK_MS = 10 * 60 * 1000; // reclaim a slot lock stuck for >10 min

export async function GET() {
  // No CRON_SECRET gate — triggered by localhost curl on EC2 (no auth header).
  await dbConnect();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);

  // Candidate plans: active create-on-generate plans that still have slots left.
  const plans = await AutomationPlan.find({
    active:            true,
    automationEnabled: true,
    postQueueMode:     'delay_generate_publish',
    'queueTiming.generateStartAt': { $exists: true },
    $expr: { $lt: ['$postIndex', '$queueTiming.postLimit'] },
  })
    .sort({ updatedAt: 1 })
    .limit(BATCH)
    .lean();

  const logs = [];
  const log = (m, e) => {
    const line = e !== undefined ? `${m} | ${JSON.stringify(e)}` : m;
    logs.push(line);
    console.log('[FILL-QUEUE]', line);
  };

  const stats = { found: plans.length, filled: 0, failed: 0, skipped: 0 };
  const run = createRunLogger({ phase: 'fill-queue', trigger: 'generate', source: 'automation' });

  for (const plan of plans) {
    const idx = plan.postIndex || 0;
    const t = plan.queueTiming || {};
    const stepDays = Number(t.stepDays) || 1;
    const publishAfterMin = Number(t.publishAfterMin) || 24 * 60;

    // Publish is anchored to the user's chosen posting time (postingHour:minute).
    // Each slot publishes stepDays after the previous, at that same clock time, and
    // is GENERATED publishAfterMin before its publish instant. Fall back to the old
    // save-time anchor only for legacy plans without a publishStartAt.
    let publishAt, dueAt;
    if (t.publishStartAt) {
      const pubStart = new Date(t.publishStartAt).getTime();
      publishAt = new Date(pubStart + idx * stepDays * DAY_MS);
      dueAt = new Date(publishAt.getTime() - publishAfterMin * 60 * 1000);
    } else {
      const startTs = new Date(t.generateStartAt).getTime();
      dueAt = new Date(startTs + idx * stepDays * DAY_MS);
      publishAt = new Date(dueAt.getTime() + publishAfterMin * 60 * 1000);
    }

    // Not due yet — skip SILENTLY (no log doc, else every not-due plan would spam
    // an empty "unknown" AutomationLog on every 5-min cron run).
    if (dueAt > now) { stats.skipped++; continue; }

    // Atomically claim THIS slot so overlapping cron runs never double-generate.
    const claimed = await AutomationPlan.findOneAndUpdate(
      {
        _id:       plan._id,
        postIndex: idx,
        $or: [
          { generatingSlot: null },
          { generatingSlot: { $exists: false } },
          { generatingSince: { $lt: staleBefore } },
        ],
      },
      { $set: { generatingSlot: idx, generatingSince: now } },
      { new: true }
    );
    if (!claimed) {
      // Another run already owns this slot — skip silently (no log doc).
      stats.skipped++;
      continue;
    }

    // Only a genuinely due + claimed slot gets an AutomationLog doc.
    const slog = run.plan({ userId: plan.userId, planId: plan._id });

    // Business + city come from the GMB LOCATION the plan posts to (e.g. "CB Prints",
    // "Faridabad") — never the separate selectedBusiness account.
    const loc0 = Array.isArray(plan.locations) && plan.locations[0] ? plan.locations[0] : null;
    const businessName = loc0?.name || loc0?.title || plan.businessName || '';
    const cityName = loc0?.locality || loc0?.name || plan.businessName || '';
    const keywords = Array.isArray(plan.keywords) ? plan.keywords.filter(Boolean) : [];
    const keyword = keywords.length ? keywords[idx % keywords.length] : (plan.keywords?.[0] || '');

    slog.info('queue:start', `slot ${idx}/${t.postLimit} keyword="${keyword}" biz="${businessName}"`);

    try {
      const imagePrompt = await generateImagePrompt({ keyword, businessName, cityName });
      const { imageUrl, postText, descriptions } = await generateImageAndText({
        imagePrompt,
        keyword,
        businessName,
        cityName,
        imageConfig: plan.imageConfig || {},
        platforms: plan.platforms,
      });

      if (!imageUrl || !postText) {
        throw new Error(`Missing ${!imageUrl ? 'imageUrl' : 'postText'} (aiAssetsGenerate down?)`);
      }

      const desc = descriptions || {};
      const platformsForPost = (Array.isArray(plan.platforms) ? plan.platforms : ['gmb'])
        .filter((p) => ['gmb', 'fb', 'ig'].includes(p));
      const scheduledDate = publishAt; // publish at the user's chosen posting time

      // Create exactly ONE real Post — only now that we have a real image + text.
      const post = await Post.create({
        userId:              plan.userId,
        promat:              keyword,
        description:         postText,
        gmbDescription:      desc.gmb || postText,
        fbDescription:       desc.fb || postText,
        igDescription:       desc.ig || postText,
        liDescription:       desc.li || postText,
        piDescription:       desc.pin || postText,
        pinTitle:            desc.pinTitle || '',
        ytDescription:       desc.yt || postText,
        scheduledDateSource: platformsForPost.length ? platformsForPost : ['gmb'],
        status:              'scheduled',
        mediaType:           'image',
        aiOutput:            imageUrl,
        generateContentAt:   dueAt,
        scheduledDate,
        automationQueued:    true,
        automationPlanId:    plan._id,
        accessToken:         plan.accessToken  || '',
        refreshToken:        plan.refreshToken || '',
        checkmark:           'both',
        error:               '',
        locations: (plan.locations || []).map((l) => ({
          locationId: l.locationId || '',
          accountId:  l.accountId  || '',
          name:       l.name       || '',
          address:    l.address    || '',
          locality:   l.locality   || '',
          websiteUrl: l.websiteUrl || '',
          isPosted:   false,
        })),
        fbPages: platformsForPost.includes('fb') && Array.isArray(plan.fbPages)
          ? plan.fbPages.filter((p) => p?.pageId).map((p) => ({
              pageId:          p.pageId,
              pageName:        p.pageName || '',
              pageAccessToken: p.pageAccessToken || '',
              caption:         desc.fb || postText,
              isPosted:        false,
            }))
          : [],
        igPages: platformsForPost.includes('ig') && Array.isArray(plan.igPages)
          ? plan.igPages.filter((a) => a?.igId).map((a) => ({
              igId:            a.igId,
              igUsername:      a.igUsername || '',
              pageAccessToken: a.pageAccessToken || '',
              caption:         desc.ig || postText,
              isPosted:        false,
            }))
          : [],
      });

      // Advance the plan to the next slot and release the lock (guarded on the
      // same postIndex so a concurrent run can't double-advance).
      await AutomationPlan.updateOne(
        { _id: plan._id, postIndex: idx },
        {
          $inc: { postIndex: 1 },
          $set: { generatingSlot: null, generatingSince: null, lastPostDate: now },
        }
      );

      slog.success('queue:filled', `post ${post._id} → scheduled publishAt=${scheduledDate.toISOString()}`);
      log(`Created post ${post._id} slot ${idx} → scheduled publishAt=${scheduledDate.toISOString()}`);
      stats.filled++;

      // ── WhatsApp preview (image + caption), non-blocking ─────────────────────
      let waStatus = 'skipped';
      try {
        const SEL = 'phone mobile whatsappNumber contactNumber fullName name email userId';
        const phoneOf = (u) => u?.phone || u?.mobile || u?.whatsappNumber || u?.contactNumber || '';
        const candidates = [];
        if (plan.userId) {
          const byUserId = await User.findOne({ userId: plan.userId }).select(SEL).lean().catch(() => null);
          if (byUserId) candidates.push(byUserId);
        }
        if (plan.userRef) {
          const byRef = await User.findById(plan.userRef).select(SEL).lean().catch(() => null);
          if (byRef) candidates.push(byRef);
        }
        const waUser = candidates.find((u) => phoneOf(u)) || candidates[0] || null;
        const rawPhone = phoneOf(waUser) || plan.phone || '';
        const testOverride = process.env.AUTOMATION_TEST_WHATSAPP_NUMBER || '';
        const destination = normalizeIndiaPhone(testOverride) || normalizeIndiaPhone(rawPhone);
        const diag = `userFound=${!!waUser} rawPhone="${rawPhone}" override="${testOverride}" normalized=${destination || 'null'}`;

        if (destination) {
          const parts = String(waUser?.fullName || waUser?.name || '').trim().split(/\s+/).filter(Boolean);
          const waRes = await sendDailyPostUpdateWhatsApp({
            destination,
            firstName: parts[0] || 'User',
            lastName: parts.slice(1).join(' '),
            postContent: postText,
            imageUrl,
          });
          if (waRes.ok) {
            waStatus = 'sent';
            slog.info('queue:whatsapp', `preview sent → ${destination}`);
            log(`WhatsApp preview sent → ${destination} (post ${post._id})`);
            logAutomationLine(`WHATSAPP SENT   user=${plan.userId} post=${post._id} to=${destination}`);
          } else {
            waStatus = 'failed';
            log(`WhatsApp preview failed (post ${post._id}) — ${waRes.error}`);
            logAutomationLine(`WHATSAPP FAILED user=${plan.userId} post=${post._id} to=${destination} err="${String(waRes.error).slice(0, 200)}"`);
          }
        } else {
          waStatus = 'no-phone';
          log(`WhatsApp preview skipped — ${diag} (post ${post._id})`);
          logAutomationLine(`WHATSAPP NO-PHONE user=${plan.userId} post=${post._id} | ${diag}`);
        }
      } catch (waErr) {
        waStatus = 'error';
        log(`WhatsApp preview error (post ${post._id}) — ${waErr.message}`);
        logAutomationLine(`WHATSAPP ERROR  user=${plan.userId} post=${post._id} err="${String(waErr.message).slice(0, 200)}"`);
      }

      logGenerate({ ok: true, userId: plan.userId, postId: post._id, keyword, imageUrl, whatsapp: waStatus });
    } catch (err) {
      // Generation failed → create NO document. Release the lock and leave
      // postIndex unchanged so this same slot retries on the next cron run.
      slog.fail('queue:generate', `content generation failed for keyword="${keyword}"`, err);
      log(`FAIL plan ${plan._id} slot ${idx}`, err.message);
      await AutomationPlan.updateOne(
        { _id: plan._id },
        { $set: { generatingSlot: null, generatingSince: null } }
      );
      logGenerate({ ok: false, userId: plan.userId, postId: null, keyword, error: err.message });
      stats.failed++;
    }
  }

  const logSave = await run.flush();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    runId: run.runId,
    automationLogsSaved: logSave.saved,
    ...stats,
    logs,
  });
}
