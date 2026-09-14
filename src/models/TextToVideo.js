import mongoose from "mongoose";

// One caption block per platform — { caption, title }
const CaptionSchema = new mongoose.Schema(
  {
    caption: { type: String, default: null },
    title: { type: String, default: null },
  },
  { _id: false }
);

const TextToVideoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    businessName: { type: String, required: true },

    // Mutually exclusive — inputMode tells which of the two was used
    inputMode: { type: String, enum: ["text", "script"], default: "text" },
    content: { type: String, required: true }, // the offer text or the raw script

    language: { type: String, default: null }, // null when generated from a script
    keywords: { type: String, default: "" },
    presenterGender: { type: String, enum: ["male", "female"], default: "male" },
    durationSeconds: { type: Number, default: null }, // requested video length (10 | 20)

    videoUrl: { type: String, required: true },
    // Pending Post created for this video so it can use the /post-management
    // approve → publish flow. Null for older videos until posting is enabled.
    postId: { type: String, default: null },
    taskId: { type: String, default: null },
    finalScript: { type: String, default: null }, // the actual script spoken in the video (AI-written or user's)

    // Ready-to-post captions per platform, returned by the generation API
    captions: {
      instagram: { type: CaptionSchema, default: null },
      facebook: { type: CaptionSchema, default: null },
      pinterest: { type: CaptionSchema, default: null },
      linkedin: { type: CaptionSchema, default: null },
    },

    cost: { type: Number, default: 300 },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },

    // Whether/where this video has been published — same shape for both platforms
    published: {
      facebook: {
        posted: { type: Boolean, default: false },
        postId: { type: String, default: "" },
        postedAt: { type: Date, default: null },
        error: { type: String, default: "" },
      },
      instagram: {
        posted: { type: Boolean, default: false },
        postId: { type: String, default: "" },
        postedAt: { type: Date, default: null },
        error: { type: String, default: "" },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.TextToVideo ||
  mongoose.model("TextToVideo", TextToVideoSchema);
