import mongoose from "mongoose";

const ImageToVideoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    sourceImageUrl: { type: String, default: "" }, // S3 URL the video was rendered from
    prompt: { type: String, default: "" }, // motion prompt — may be empty

    videoUrl: { type: String, required: true },
    // The Post row /api/image-to-video creates, so the library entry and this
    // history row can be traced to each other.
    postId: { type: String, default: null },

    durationSeconds: { type: Number, default: 12 }, // fixed by the page
    aspectRatio: { type: String, default: "9:16" }, // fixed by the API
    quality: { type: String, default: "720p" }, // fixed by the API

    cost: { type: Number, default: 200 },
  },
  { timestamps: true }
);

// One row per rendered video — a retried save (reload / second tab) must never duplicate.
ImageToVideoSchema.index({ userId: 1, videoUrl: 1 }, { unique: true });

export default mongoose.models.ImageToVideo ||
  mongoose.model("ImageToVideo", ImageToVideoSchema);
