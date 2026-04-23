import mongoose from "mongoose";

/**
 * Tracks every chatbot-triggered action (health_score, magic_qr, website, insights).
 *
 * Lifecycle:
 *   pending  → action created, background processing started
 *   success  → action completed, webhook fired
 *   failed   → action errored, webhook fired with failure payload
 *
 * Designed to be queue-friendly: the `status` field allows a BullMQ/Redis
 * worker to pick up pending records for retry without schema changes.
 */
const ChatbotActionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["health_score", "magic_qr", "website", "insights"],
      required: true,
    },
    locationId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    /** Action output: url, score, metrics, etc. Populated after processing. */
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "chatbot_actions",
  }
);

ChatbotActionSchema.index({ session_id: 1, action: 1, createdAt: -1 });
ChatbotActionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ChatbotAction ||
  mongoose.model("ChatbotAction", ChatbotActionSchema);
