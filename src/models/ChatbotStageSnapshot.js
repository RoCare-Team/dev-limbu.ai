import mongoose from "mongoose";

const chatbotStageSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    total: { type: Number, default: 0 },
    stageCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    stageOrder: { type: [String], default: [] },
    /** Compact rows: user_id, phone, stages, message_count, last_active, etc. (no full history) */
    users: { type: mongoose.Schema.Types.Mixed, default: [] },
    fetchedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.ChatbotStageSnapshot ||
  mongoose.model("ChatbotStageSnapshot", chatbotStageSnapshotSchema);
