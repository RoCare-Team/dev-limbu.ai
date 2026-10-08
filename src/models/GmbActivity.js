import mongoose from "mongoose";

/**
 * Everything the platform DID on a client's Google profile, as it happens.
 *
 * Until this existed, work left no trace in our database: the auto-reply cron
 * answered reviews and only console-logged it, and profile optimization pushed
 * fields to Google without recording what changed. That made a client report
 * impossible to write honestly — so each action is written here when it
 * succeeds, and the weekly report simply reads it back.
 *
 * Nothing here is reconstructed after the fact: a row exists only because the
 * action really went through.
 */
const GmbActivitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: ["review_reply", "profile_update"],
      required: true,
      index: true,
    },

    locationId: { type: String, default: "" },
    locationName: { type: String, default: "" },

    /**
     * What happened, shaped by `type`:
     *   review_reply   → { reviewId, rating, reviewer, comment, reply }
     *   profile_update → { fields: ["description", "services"], note }
     */
    details: { type: mongoose.Schema.Types.Mixed, default: {} },

    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// The report always asks "what did we do for this user in this window".
GmbActivitySchema.index({ userId: 1, at: -1 });

export default mongoose.models.GmbActivity ||
  mongoose.model("GmbActivity", GmbActivitySchema);
