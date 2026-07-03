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
import {
  generateImagePrompt,
  generateImage,
  generatePostText,
} from '@/lib/automationPlanContentGeneration';
import { createRunLogger } from '@/lib/automationRunLogger';

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
      locked.status = 'scheduled';
      locked.error = '';
      await locked.save();

      slog.success('queue:filled', `image+text generated → scheduled publishAt=${locked.scheduledDate?.toISOString()}`);
      log(`Filled post ${c._id} → scheduled publishAt=${locked.scheduledDate?.toISOString()}`);
      stats.filled++;
    } catch (err) {
      slog.fail('queue:generate', `content generation failed for keyword="${keyword}"`, err);
      log(`FAIL post ${c._id}`, err.message);
      locked.status = 'failed';
      locked.error = err.message || 'Fill failed';
      await locked.save();
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
