import cron from "node-cron";
import mongoose from "mongoose";
import { syncChatbotUsersToApp } from "../limbuBotUserSync";

// ---------------------------------------------------------------------------
// FIX: DB-backed distributed lock — safe across multiple workers / PM2 clusters.
// A simple in-memory `isRunning` flag is per-process, so on Vercel or multi-
// instance deployments every worker runs simultaneously and causes duplicate inserts.
// ---------------------------------------------------------------------------

const LockSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  lockedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
const Lock =
  mongoose.models.chatbot_sync_lock ||
  mongoose.model("chatbot_sync_lock", LockSchema);

const LOCK_KEY = "chatbot_sync";
// Lock expires after 8 minutes — if a run crashes without releasing, next run
// can acquire after this TTL. Keep it safely under the 10-min cron interval.
const LOCK_TTL_MS = 8 * 60 * 1000;

async function acquireLock() {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);
  try {
    await Lock.create({ key: LOCK_KEY, lockedAt: now, expiresAt });
    return true;
  } catch (err) {
    // 11000 = duplicate key = another worker already holds the lock
    if (err.code === 11000) return false;
    throw err;
  }
}

async function releaseLock() {
  try {
    await Lock.deleteOne({ key: LOCK_KEY });
  } catch (err) {
    console.error("[chatbot-cron] Failed to release lock:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Cron scheduler
// FIX: note for serverless environments — node-cron only works in long-running
// Node processes (Express, Next.js standalone, Railway, Render, PM2).
// If you are on Vercel serverless, use vercel.json `crons` config instead and
// hit a dedicated API route — this file should only run in a persistent process.
// ---------------------------------------------------------------------------

let cronJob = null;

export function startChatbotSyncCron() {
  if (cronJob) {
    console.log("⚠️  Chatbot Sync Cron already registered — skipping duplicate start");
    return;
  }

  console.log("✅ Chatbot Sync Cron Started (every 10 minutes)");

  cronJob = cron.schedule("*/10 * * * *", async () => {
    // FIX: distributed lock — if another worker is running, skip this tick
    const acquired = await acquireLock().catch((err) => {
      console.error("[chatbot-cron] Lock acquire error:", err.message);
      return false;
    });

    if (!acquired) {
      console.log("⏳ Another worker is running chatbot sync — skipping this tick");
      return;
    }

    const startedAt = Date.now();
    console.log("🚀 Starting chatbot user sync...");

    try {
      const result = await syncChatbotUsersToApp({
        minMessageCount: 1,
        maxToInsert: 500,
      });

      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`✅ Chatbot Sync Complete in ${elapsed}s:`, result);

      // Log non-Indian numbers so they are visible and not silent phantoms
      if (result.nonIndian?.length) {
        console.warn(
          `⚠️  [chatbot-sync] ${result.nonIndian.length} non-Indian number(s) skipped:`,
          result.nonIndian,
        );
      }

      if (result.errors?.length) {
        console.error(
          `❌ [chatbot-sync] ${result.errors.length} insert error(s):`,
          result.errors,
        );
      }
    } catch (err) {
      console.error("❌ Chatbot Sync Error:", err);
    } finally {
      await releaseLock();
    }
  });
}

export function stopChatbotSyncCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("🛑 Chatbot Sync Cron stopped");
  }
}