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
    /** Chatbot / WhatsApp flow user phone (digits), same idea as FacebookPage.phone */
    phone: { type: String, default: "" },
    /** "manual" (dashboard OAuth) vs "chatbot" (connect-business / WhatsApp flow) */
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.models.LinkedinProfile ||
  mongoose.model("LinkedinProfile", LinkedinProfileSchema);
