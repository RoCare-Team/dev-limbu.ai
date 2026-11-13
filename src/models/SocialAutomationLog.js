import mongoose from "mongoose";

/**
 * One thing the social automation did: replied to a comment or DM, or hid /
 * deleted a negative comment. The unique (kind, objectId) index is also how the
 * cron knows an item was already handled.
 */
const SocialAutomationLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: ["comment_reply", "dm_reply", "hidden", "deleted", "skipped"], required: true },
    platform: { type: String, enum: ["facebook", "instagram"], required: true },
    pageId: String, // FB page id or IG account id
    accountName: String,
    objectId: { type: String, required: true }, // comment id or message id
    postId: String,
    authorName: String,
    text: String, // the customer's comment / message
    reply: String, // what we sent
    reason: String, // why a comment was hidden
    permalink: String,
    restored: { type: Boolean, default: false }, // hidden comment shown again by the owner
  },
  { timestamps: true }
);

SocialAutomationLogSchema.index({ kind: 1, objectId: 1 }, { unique: true });
SocialAutomationLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SocialAutomationLog || mongoose.model("SocialAutomationLog", SocialAutomationLogSchema);
