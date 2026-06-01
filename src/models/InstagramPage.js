import mongoose from "mongoose";

const InstagramPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    phone: { type: String, default: "" },
    type: { type: String, default: "instagram" },
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

// ✅ Duplicate accounts nahi banenge
InstagramPageSchema.index(
  { userId: 1, igId: 1 },
  { unique: true }
);

// ✅ Cache clear — naya index register hoga
export default mongoose.models.InstagramPage ||
  mongoose.model("InstagramPage", InstagramPageSchema);
