import mongoose from "mongoose";

const KeywordItemSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true },
    type: {
      type: String,
      enum: ["primary", "long-tail", "local", "commercial", "gbp"],
      default: "primary",
    },
    volume: { type: Number, default: 0 },
    competition: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    intent: { type: String, default: "" },
  },
  { _id: false }
);

const KeywordResearchReportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    businessName: { type: String, required: true },
    slug: { type: String, default: "" },
    locationName: { type: String, default: "" },
    inferredCategory: { type: String, default: "" },
    inferredServices: { type: [String], default: [] },
    industry: { type: String, default: "" },
    searchIntent: { type: String, default: "" },
    aiSummary: { type: String, default: "" },
    keywords: { type: [KeywordItemSchema], default: [] },
    savedCount: { type: Number, default: 0 },
    pdfUrl: { type: String, default: "" },
    pdfStatus: {
      type: String,
      enum: ["pending", "generating", "generated", "failed"],
      default: "pending",
    },
    pdfError: { type: String, default: "" },
    whatsappStatus: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
    },
    whatsappError: { type: String, default: "" },
    emailStatus: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
    },
    emailError: { type: String, default: "" },
    reportType: { type: String, enum: ["ai", "saved"], default: "ai" },
    // 👇 NEW: client approval workflow (internal — agency sets this)
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalNote: { type: String, default: "" },
    approvalUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

KeywordResearchReportSchema.index({ userId: 1, createdAt: -1 });

const KeywordResearchReport =
  mongoose.models.KeywordResearchReport ||
  mongoose.model("KeywordResearchReport", KeywordResearchReportSchema);

export default KeywordResearchReport;
