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
    /** WhatsApp / mobile number (primary key in the new phone-based flow) */
    phone: {
      type: String,
      default: "",
      index: true,
    },
    /** Legacy / OAuth-based session identifier (kept for backward compat) */
    session_id: {
      type: String,
      default: "",
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
      default: "",
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
