import mongoose from "mongoose";

const FacebookPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    phone: { type: String, default: "" },
    type: { type: String, default: "facebook" },
    pageId: { type: String, required: true },
    pageName: String,
    pageAccessToken: String,
    pageTokenExpiresAt: Date,
    userAccessToken: String,
    userTokenExpiresAt: Date,
    platform: { type: String, default: "facebook" },
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true }
);

FacebookPageSchema.index(
  { userId: 1, pageId: 1 },
  { unique: true }
);

// ✅ Cache delete karo taaki naya index register ho
export default mongoose.models.FacebookPage ||
  mongoose.model("FacebookPage", FacebookPageSchema);
