import mongoose from "mongoose";

/**
 * Every WhatsApp/chatbot message received via the real-time webhook
 * (`/api/webhooks/limbubot`). Replaces slow polling of the external contacts
 * API for building conversation history.
 *
 * `wamid` is the WhatsApp message id and is the idempotency key — the same
 * webhook delivered twice must not create two rows.
 */
const ChatbotMessageSchema = new mongoose.Schema(
  {
    /** WhatsApp message id — unique per message (idempotency key) */
    wamid: { type: String, index: true, sparse: true, unique: true },

    /** `wa_916386103750` style id */
    waId: { type: String, index: true, default: "" },
    /** 10-digit Indian mobile (when resolvable) */
    phone: { type: String, index: true, default: "" },

    name: { type: String, default: "" },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      default: "inbound",
    },
    type: { type: String, default: "text" },
    content: { type: String, default: "" },

    workspaceId: { type: Number, default: null },
    contactId: { type: Number, default: null },
    repliedToWamid: { type: String, default: null },

    /** Original WhatsApp message timestamp */
    timestamp: { type: Date, default: null },
    /** Raw webhook event name, e.g. message.received */
    event: { type: String, default: "" },
  },
  { timestamps: true, collection: "chatbot_messages" },
);

ChatbotMessageSchema.index({ waId: 1, timestamp: -1 });
ChatbotMessageSchema.index({ phone: 1, timestamp: -1 });

export default mongoose.models.ChatbotMessage ||
  mongoose.model("ChatbotMessage", ChatbotMessageSchema);
