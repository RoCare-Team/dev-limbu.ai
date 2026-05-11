import mongoose from "mongoose";

const InstagramPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    phone: { type: String, default: "" },
    igId: { type: String, required: true },
    igUsername: String,
    pageId: String,
    pageAccessToken: String,
    userAccessToken: String,
    userTokenExpiresAt: Date,
    platform: { type: String, default: "instagram" },
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.models.InstagramPage ||
  mongoose.model("InstagramPage", InstagramPageSchema);
