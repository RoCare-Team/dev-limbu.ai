
import mongoose from "mongoose";

const FacebookPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },   // 🔥 Important
    pageId: String,
    pageName: String,
    pageAccessToken: String,
    platform: { type: String, default: "facebook" },
  },
  { timestamps: true }
);

export default mongoose.models.FacebookPage ||
  mongoose.model("FacebookPage", FacebookPageSchema);
