import mongoose from "mongoose";

const AiAvatarVideoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    mode: { type: String, enum: ["character", "photo"], required: true },
    characterId: { type: String, default: null }, // set when mode="character"
    characterName: { type: String, default: null },

    script: { type: String, required: true },
    background: { type: String, default: "" },
    pose: { type: String, default: "" },

    language: { type: String, default: null },
    voiceId: { type: String, default: null },
    voiceName: { type: String, default: null },

    aspectRatio: { type: String, default: "16:9" },
    resolution: { type: String, default: "1080p" },

    videoUrl: { type: String, required: true },
    videoId: { type: String, default: null },
    storage: { type: String, default: null },
    durationSeconds: { type: Number, default: null },

    cost: { type: Number, default: 350 },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default mongoose.models.AiAvatarVideo ||
  mongoose.model("AiAvatarVideo", AiAvatarVideoSchema);
