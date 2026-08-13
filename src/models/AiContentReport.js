import mongoose from "mongoose";

/**
 * User-submitted report against AI generated content (image / video / text).
 * Written by POST /api/ai-content-report, listed via GET (admin/moderation).
 */
export const AI_CONTENT_REPORT_REASONS = [
  "offensive",
  "sexual",
  "violent",
  "hateful",
  "misleading",
  "copyright",
  "spam",
  "other",
];

export const AI_CONTENT_REPORT_MEDIA_TYPES = ["image", "video", "text"];

const aiContentReportSchema = new mongoose.Schema(
  {
    postId: { type: String, default: "", index: true },
    userId: { type: String, default: "", index: true },

    reason: {
      type: String,
      enum: AI_CONTENT_REPORT_REASONS,
      required: true,
      index: true,
    },
    details: { type: String, default: "" },

    mediaType: {
      type: String,
      enum: AI_CONTENT_REPORT_MEDIA_TYPES,
      default: "image",
    },
    mediaUrl: { type: String, default: "" },

    // Where the report was raised from, e.g. "create_asset_screen".
    source: { type: String, default: "" },

    // Client supplied timestamp; falls back to server time when absent/invalid.
    reportedAt: { type: Date, default: Date.now, index: true },

    status: {
      type: String,
      enum: ["pending", "reviewed", "actioned", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

aiContentReportSchema.index({ userId: 1, createdAt: -1 });
aiContentReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.AiContentReport ||
  mongoose.model("AiContentReport", aiContentReportSchema);
