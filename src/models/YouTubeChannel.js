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
    /** Chatbot / WhatsApp flow user phone (digits), same idea as FacebookPage.phone */
    phone: { type: String, default: "" },
    /** "manual" (dashboard OAuth) vs "chatbot" (connect-business / WhatsApp flow) */
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.models.YouTubeChannel ||
  mongoose.model("YouTubeChannel", YouTubeChannelSchema);