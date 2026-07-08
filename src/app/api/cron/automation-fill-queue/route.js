/**
 * GET /api/cron/automation-fill-queue
 *
 * Picks Post rows created by user-settings (automationQueued, status pending)
 * where generateContentAt <= now, generates image + copy from AutomationPlan,
 * then sets status=scheduled so /api/publish-scheduled can publish at scheduledDate.
 *
 * Env: CRON_SECRET (optional) — require Authorization: Bearer … when set.
 * Run every 5–15 minutes on your host (not required every 10 min for all other crons).
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/PostStatus';
import AutomationPlan from '@/models/AutomationPlan';
import User from '@/models/User';
import {
  generateImagePrompt,
  generateImage,
  generatePostText,
} from '@/lib/automationPlanContentGeneration';
import { createRunLogger } from '@/lib/automationRunLogger';
import { sendDailyPostUpdateWhatsApp, normalizeIndiaPhone } from '@/lib/dailyPostWhatsApp';
import { logGenerate, logAutomationLine } from '@/lib/automationFileLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BATCH = 15;

export async function GET(request) {
  // No CRON_SECRET gate — triggered by localhost curl on EC2 (no auth header).
  await dbConnect();
  const now = new Date();

  const candidates = await Post.find({
    automationQueued: true,
    status:             'pending',
    generateContentAt:  { $lte: now },
    $or: [
      { aiOutput: { $exists: false } },
      { aiOutput: '' },
      { aiOutput: null },
    ],
  })
    .sort({ generateContentAt: 1 })
    .limit(BATCH)
    .lean();

  const logs = [];
  const log = (m, e) => {
    const line = e !== undefined ? `${m} | ${JSON.stringify(e)}` : m;
    logs.push(line);
    console.log('[FILL-QUEUE]', line);
  };

  const stats = { found: candidates.length, filled: 0, failed: 0, skipped: 0 };

  const run = createRunLogger({ phase: 'fill-queue', trigger: 'generate', source: 'automation' });

  for (const c of candidates) {
    const slog = run.plan({ userId: c.userId, planId: c.automationPlanId, postId: c._id });
    slog.info('queue:start', `generateContentAt=${c.generateContentAt?.toISOString?.() || ''}`);

    const locked = await Post.findOneAndUpdate(
      { _id: c._id, status: 'pending' },
      { status: 'processing' },
      { new: true }
    );
    if (!locked) {
      slog.skip('queue:lock', 'post already locked / status changed');
      stats.skipped++;
      continue;
    }

    let plan = null;
    if (c.automationPlanId) {
      plan = await AutomationPlan.findById(c.automationPlanId).lean();
    }
    if (!plan) {
      plan = await AutomationPlan.findOne({
        userId:            c.userId,
        active:            true,
        automationEnabled: true,
      }).lean();
    }

    if (!plan) {
      log(`No AutomationPlan for post ${c._id}`);
      slog.fail('queue:plan-lookup', 'no active AutomationPlan for this post');
      locked.status = 'failed';
      locked.error = 'No active automation plan';
      await locked.save();
      stats.failed++;
      continue;
    }

    const keyword = c.promat || plan.keywords?.[0] || '';
    const loc0 = Array.isArray(c.locations) ? c.locations[0] : null;
    const cityName =
      loc0?.locality || loc0?.name || plan.businessName || '';

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
        throw new Error(`Missing ${!imageUrl ? 'imageUrl' : 'postText'} (aiAssetsGenerate / OPENAI_API_KEY?)`);
      }

      locked.aiOutput = imageUrl;
      locked.description = postText;
      locked.gmbDescription = postText;
      locked.fbDescription = postText;
      locked.igDescription = postText;
      locked.status = 'scheduled'; // "Ready" — content generated + stored, awaiting publish
      locked.error = '';
      await locked.save();

      slog.success('queue:filled', `image+text generated → scheduled publishAt=${locked.scheduledDate?.toISOString()}`);
      log(`Filled post ${c._id} → scheduled publishAt=${locked.scheduledDate?.toISOString()}`);
      stats.filled++;

      // ── Send the generated post preview to the user's WhatsApp (non-blocking) ──
      // Fires once per post (this success path only runs when a pending post is
      // generated). Publishing later uses the stored content — it never regenerates.
      let waStatus = 'skipped';
      try {
        const SEL = 'phone mobile whatsappNumber contactNumber fullName name email userId';
        const phoneOf = (u) =>
          u?.phone || u?.mobile || u?.whatsappNumber || u?.contactNumber || '';

        // Look up BOTH by userId (canonical dashboard identity, usually has the
        // phone) and by userRef (may be an older row without a phone). The plan's
        // userRef sometimes points to a duplicate record with no phone, so we pick
        // whichever record actually has a phone.
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
        // Testing override: set AUTOMATION_TEST_WHATSAPP_NUMBER to force the preview
        // to your own number regardless of the user's stored phone.
        const testOverride = process.env.AUTOMATION_TEST_WHATSAPP_NUMBER || '';
        const destination = normalizeIndiaPhone(testOverride) || normalizeIndiaPhone(rawPhone);

        // Diagnostic line — always written so we can see exactly why WA did/didn't fire.
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
            log(`WhatsApp preview sent → ${destination} (post ${c._id})`);
            logAutomationLine(`WHATSAPP SENT   user=${c.userId} post=${c._id} to=${destination}`);
          } else {
            waStatus = 'failed';
            log(`WhatsApp preview failed (post ${c._id}) — ${waRes.error}`);
            logAutomationLine(`WHATSAPP FAILED user=${c.userId} post=${c._id} to=${destination} err="${String(waRes.error).slice(0, 200)}"`);
          }
        } else {
          waStatus = 'no-phone';
          log(`WhatsApp preview skipped — ${diag} (post ${c._id})`);
          logAutomationLine(`WHATSAPP NO-PHONE user=${c.userId} post=${c._id} | ${diag}`);
        }
      } catch (waErr) {
        waStatus = 'error';
        log(`WhatsApp preview error (post ${c._id}) — ${waErr.message}`);
        logAutomationLine(`WHATSAPP ERROR  user=${c.userId} post=${c._id} err="${String(waErr.message).slice(0, 200)}"`);
      }

      logGenerate({
        ok: true,
        userId: c.userId,
        postId: c._id,
        keyword,
        imageUrl,
        whatsapp: waStatus,
      });
    } catch (err) {
      slog.fail('queue:generate', `content generation failed for keyword="${keyword}"`, err);
      log(`FAIL post ${c._id}`, err.message);
      locked.status = 'failed';
      locked.error = err.message || 'Fill failed';
      await locked.save();
      logGenerate({ ok: false, userId: c.userId, postId: c._id, keyword, error: err.message });
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
