
import mongoose from "mongoose";

const FacebookPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },   // 🔥 Important
    phone: { type: String, default: "" },
    pageId: String,
    pageName: String,
    pageAccessToken: String,
    pageTokenExpiresAt: Date,
    platform: { type: String, default: "facebook" },
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.models.FacebookPage ||
  mongoose.model("FacebookPage", FacebookPageSchema);
