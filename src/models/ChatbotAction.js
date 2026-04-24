import mongoose from "mongoose";

/**
 * Tracks every chatbot-triggered action (health_score, magic_qr, website, insights).
 *
 * Phone number is the SOLE external identifier — session_id is removed.
 *
 * Lifecycle:
 *   pending → action created, background processing started
 *   success → action completed, webhook fired
 *   failed  → action errored, webhook fired with failure payload
 */
const ChatbotActionSchema = new mongoose.Schema(
  {
    /** WhatsApp / mobile number — primary external identifier */
    phone: {
      type:     String,
      required: true,
      index:    true,
    },
    action: {
      type:     String,
      enum:     ["health_score", "magic_qr", "website", "insights", "keyword_planner"],
      required: true,
    },
    locationId: {
      type:     String,
      required: true,
    },
    email: {
      type:    String,
      default: "",
    },
    status: {
      type:    String,
      enum:    ["pending", "success", "failed"],
      default: "pending",
    },
    /** Action output: url, score, metrics, etc. Populated after processing. */
    result: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "chatbot_actions",
  }
);

ChatbotActionSchema.index({ phone: 1, action: 1, createdAt: -1 });
ChatbotActionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ChatbotAction ||
  mongoose.model("ChatbotAction", ChatbotActionSchema);
