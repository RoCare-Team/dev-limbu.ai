import mongoose from "mongoose";

/**
 * One AutomationLog document = one plan/post processed in one cron run.
 * `steps[]` is the ordered trail of everything that happened, each marked
 * pass / fail / skip / info so you can see the EXACT step (code region) where
 * automation stopped, with the real error message attached.
 *
 * Written by:
 *   - /api/cron/automation-plans   (legacy publish pipeline)   phase="publish"
 *   - /api/cron/automation-fill-queue (delay: generate)        phase="fill-queue"
 *   - /api/publish-scheduled       (delay: publish)            phase="publish-scheduled"
 *
 * Read via GET /api/automation-logs?userId=USR_xxx  (newest first).
 */
const stepSchema = new mongoose.Schema(
  {
    seq: { type: Number },
    name: { type: String },          // e.g. "guard:start-date", "publish:gmb"
    status: {
      type: String,
      enum: ["pass", "fail", "skip", "info", "success"],
      default: "info",
    },
    message: { type: String, default: "" },
    error: { type: String, default: "" }, // real error text when status=fail
    at: { type: Date },
    durationMs: { type: Number, default: 0 }, // time since previous step
  },
  { _id: false }
);

/**
 * Ek GMB location ka nateeja, is run me.
 *
 * Pehle log sirf "posted 124/125 location(s)" bolta tha aur ek hi error message
 * dikhata tha — 125 locations wale post me ye pata hi nahi chalta tha ki KAUNSI
 * location baaki reh gayi aur kyun. Ab har location apne naam, status, koshishon
 * ki ginti aur apne error ke saath record hoti hai.
 */
const locationResultSchema = new mongoose.Schema(
  {
    locationId: { type: String, default: "" },
    name: { type: String, default: "" },
    locality: { type: String, default: "" },
    isPosted: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    error: { type: String, default: "" },
    postedAt: { type: Date, default: null },
  },
  { _id: false }
);

const automationLogSchema = new mongoose.Schema(
  {
    runId: { type: String, index: true },   // groups all plans of one cron invocation
    phase: { type: String, index: true },    // publish | fill-queue | publish-scheduled
    // How this post was queued: 'automation' (auto plan) vs 'manual' (user scheduled it).
    source: {
      type: String,
      enum: ["automation", "manual"],
      default: "automation",
      index: true,
    },
    trigger: { type: String, default: "" },  // cron flags (force/dryRun/manual/tick)

    userId: { type: String, index: true },
    planId: { type: String, default: "" },
    postId: { type: String, default: "" },

    // Quick-glance context — pehle ye sirf step messages me chhupa hota tha.
    businessName: { type: String, default: "" }, // GMB location ka naam (jispe post hua)
    locality: { type: String, default: "" },      // city
    keyword: { type: String, default: "" },        // is post ka keyword
    imageUrl: { type: String, default: "" },       // generate hui image (fail pe bhi, agar bani ho)
    platforms: { type: [String], default: [] },    // gmb / fb / ig

    outcome: {
      type: String,
      enum: ["success", "skipped", "failed", "unknown"],
      default: "unknown",
      index: true,
    },
    error: { type: String, default: "" },   // top-level reason when outcome=failed

    // Per-location nateeja — "kis profile par post gaya, kis par nahi".
    gmbTotal:  { type: Number, default: 0 },
    gmbPosted: { type: Number, default: 0 },
    // Sirf un locations ki list jo abhi tak POST NAHI hui (pending/failed).
    // Poori 125 ki list har run me store karna log ko bhaari kar deta; jo bach
    // gayi wahi actionable hai. Posted ka count upar `gmbPosted` me hai.
    pendingLocations: { type: [locationResultSchema], default: [] },

    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true }
);

automationLogSchema.index({ userId: 1, createdAt: -1 });
automationLogSchema.index({ outcome: 1, createdAt: -1 });

// Auto-expire logs after 30 days so the collection never grows unbounded.
automationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.models.AutomationLog ||
  mongoose.model("AutomationLog", automationLogSchema);
