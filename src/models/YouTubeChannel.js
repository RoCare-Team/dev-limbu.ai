import mongoose from "mongoose";

const YouTubeChannelSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },   // 🔥 Important
    channelId: String,
    channelTitle: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    platform: { type: String, default: "youtube" },
  },
  { timestamps: true }
);

export default mongoose.models.YouTubeChannel ||
  mongoose.model("YouTubeChannel", YouTubeChannelSchema);