import mongoose from "mongoose";

const InstagramSchema = new mongoose.Schema(
  {
    userId: String,
    igId: String,
    igUsername: String,
    pageAccessToken: String,
    platform: { type: String, default: "instagram" },
  },
  { timestamps: true }
);

export default mongoose.models.InstagramPage ||
  mongoose.model("InstagramPage", InstagramSchema);
