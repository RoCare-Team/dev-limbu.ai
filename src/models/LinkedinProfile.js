import mongoose from "mongoose";

const LinkedinProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    pageId: { type: String, required: true }, // LinkedIn URN (e.g., urn:li:person:123 or urn:li:organization:456)
    pageName: { type: String, required: true }, // name of the person or organization
    image: { type: String }, // profile picture or company logo URL
    email: { type: String }, // optional, for personal profiles
    pageAccessToken: { type: String, required: true },
    pageTokenExpiresAt: { type: Date },
    platform: { type: String, default: "linkedin" },
    type: { type: String, enum: ["profile", "organization"], default: "profile" },
  },
  { timestamps: true }
);

export default mongoose.models.LinkedinProfile ||
  mongoose.model("LinkedinProfile", LinkedinProfileSchema);
