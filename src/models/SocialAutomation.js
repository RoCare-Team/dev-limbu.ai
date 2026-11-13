import mongoose from "mongoose";

const platformsSchema = { facebook: { type: Boolean, default: true }, instagram: { type: Boolean, default: true } };

/**
 * A user's social automation settings (one document per user). Run by
 * /api/cron/social-automation; edited on /social-media/<feature> pages.
 */
const SocialAutomationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    businessName: { type: String, default: "" },
    // What replies may tell customers: services, timings, phone, address, offers
    businessInfo: { type: String, default: "" },

    commentReply: {
      enabled: { type: Boolean, default: false },
      tone: { type: String, default: "friendly" },
      platforms: platformsSchema,
    },
    dmReply: {
      enabled: { type: Boolean, default: false },
      tone: { type: String, default: "friendly" },
      platforms: platformsSchema,
    },
    moderation: {
      enabled: { type: Boolean, default: false },
      action: { type: String, enum: ["hide", "delete"], default: "hide" },
      useAi: { type: Boolean, default: true },
      blockedWords: { type: [String], default: [] },
      platforms: platformsSchema,
    },

    lastRunAt: Date,
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SocialAutomation || mongoose.model("SocialAutomation", SocialAutomationSchema);
