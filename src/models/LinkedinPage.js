import mongoose from "mongoose";

const LinkedinPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    pageId: String, // LinkedIn URN (e.g., urn:li:person:123 or urn:li:organization:456)
    pageName: String,
    pageAccessToken: String,
    pageTokenExpiresAt: Date,
    platform: { type: String, default: "linkedin" },
    type: { type: String, default: "profile" }, // 'profile' or 'organization'
  },
  { timestamps: true }
);

export default mongoose.models.LinkedinPage ||
  mongoose.model("LinkedinPage", LinkedinPageSchema);
