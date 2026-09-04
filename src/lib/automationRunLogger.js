/**
 * Lightweight step logger for automation crons.
 *
 * Usage:
 *   const run = createRunLogger({ phase: 'publish', trigger: 'force' });
 *   const slog = run.plan({ userId, planId });
 *   slog.info('plan:start', 'processing');
 *   slog.skip('guard:quota', 'postsUsed >= limit');
 *   slog.fail('publish:gmb', 'GMB rejected', err);   // err can be Error or string
 *   slog.success('done', 'posted');
 *   ...
 *   await run.flush();   // persists ALL plan logs in one insertMany (best-effort)
 *
 * Each plan/post gets its own AutomationLog doc. Steps accumulate by reference,
 * so even if a code path `continue`s without an explicit save, run.flush() at the
 * end still persists everything recorded up to that point.
 */
import AutomationLog from "@/models/AutomationLog";

function genRunId() {
  // Date.now()/Math.random() are fine in a normal Next.js route runtime.
  return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
}

const clip = (v, n) => (v == null ? "" : String(v).slice(0, n));
const errText = (e) =>
  e == null ? "" : clip(e && e.message ? e.message : e, 2000);

export function createRunLogger({ phase = "", trigger = "", source = "automation", runId } = {}) {
  const id = runId || genRunId();
  const docs = [];

  function plan({ userId = "", planId = "", postId = "", source: planSource } = {}) {
    const doc = {
      runId: id,
      phase,
      source: planSource || source,
      trigger,
      userId: clip(userId, 200),
      planId: planId ? String(planId) : "",
      postId: postId ? String(postId) : "",
      businessName: "",
      locality: "",
      keyword: "",
      imageUrl: "",
      platforms: [],
      outcome: "unknown",
      error: "",
      gmbTotal: 0,
      gmbPosted: 0,
      pendingLocations: [],
      steps: [],
    };
    docs.push(doc);
    let last = Date.now();

    const add = (name, status, message, error) => {
      const now = Date.now();
      doc.steps.push({
        seq: doc.steps.length + 1,
        name: clip(name, 120),
        status,
        message: clip(message, 1000),
        error: errText(error),
        at: new Date(now),
        durationMs: now - last,
      });
      last = now;
      if (status === "fail") {
        doc.outcome = "failed";
        doc.error = errText(error) || clip(message, 2000) || doc.error;
      } else if (status === "skip" && doc.outcome === "unknown") {
        doc.outcome = "skipped";
      } else if (status === "success") {
        doc.outcome = "success";
      }
    };

    return {
      doc,
      setPostId: (pid) => { if (pid) doc.postId = String(pid); },
      // Business name / image URL / keyword etc. ek jagah set karo — logs page
      // inhe prominent dikhata hai (step message me dhoondhne ki zaroorat nahi).
      setMeta: (meta = {}) => {
        if (meta.businessName != null) doc.businessName = clip(meta.businessName, 200);
        if (meta.locality != null) doc.locality = clip(meta.locality, 120);
        if (meta.keyword != null) doc.keyword = clip(meta.keyword, 200);
        if (meta.imageUrl != null) doc.imageUrl = clip(meta.imageUrl, 1000);
        if (Array.isArray(meta.platforms)) doc.platforms = meta.platforms;
      },
      /**
       * Post ki locations[] daalo — log me "kis profile par gaya, kis par nahi"
       * saaf record ho jata hai. Sirf PENDING locations store hoti hain (jo bach
       * gayi wahi actionable hai); posted ka count `gmbPosted` me hai.
       */
      setLocations: (locations = []) => {
        const list = Array.isArray(locations) ? locations : [];
        doc.gmbTotal = list.length;
        doc.gmbPosted = list.filter((l) => l?.isPosted).length;
        doc.pendingLocations = list
          .filter((l) => !l?.isPosted)
          // Log doc bahut bada na ho — 125 me se pehli 50 pending kaafi hain.
          .slice(0, 50)
          .map((l) => ({
            locationId: clip(l?.locationId, 200),
            name: clip(l?.name || l?.title, 200),
            locality: clip(l?.locality || l?.city, 120),
            isPosted: false,
            attempts: Number(l?.attempts) || 0,
            error: clip(l?.error, 500),
            postedAt: l?.postedAt || null,
          }));
      },
      info: (name, message) => add(name, "info", message),
      pass: (name, message) => add(name, "pass", message),
      skip: (name, message) => add(name, "skip", message),
      fail: (name, message, error) => add(name, "fail", message, error),
      success: (name, message) => add(name, "success", message),
    };
  }

  async function flush() {
    if (!docs.length) return { saved: 0 };
    try {
      await AutomationLog.insertMany(docs, { ordered: false });
      return { saved: docs.length, runId: id };
    } catch (e) {
      console.error("[automationRunLogger] flush failed:", e.message);
      return { saved: 0, error: e.message, runId: id };
    }
  }

  return { runId: id, plan, flush, docs };
}
