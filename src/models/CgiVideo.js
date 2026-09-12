import mongoose from "mongoose";

const CgiVideoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    // Upstream job id — unique so a resumed poll (reload / second tab) can never
    // save the same ad twice, and therefore never charge for it twice.
    taskId: { type: String, required: true, unique: true },

    businessName: { type: String, required: true },
    productName: { type: String, default: "" },
    keywords: { type: String, default: "" },

    adCopy: {
      headline: { type: String, default: null },
      businessNameLine: { type: String, default: null },
      cta: { type: String, default: null },
    },

    musicMood: { type: String, default: null }, // mood actually used — never "auto"
    musicMoodReason: { type: String, default: null },

    videoUrl: { type: String, required: true },
    storageWarning: { type: String, default: null },

    durationSeconds: { type: Number, default: 10 }, // fixed by the API
    aspectRatio: { type: String, default: "9:16" }, // fixed by the API

    cost: { type: Number, default: 300 },
  },
  { timestamps: true }
);

export default mongoose.models.CgiVideo || mongoose.model("CgiVideo", CgiVideoSchema);
