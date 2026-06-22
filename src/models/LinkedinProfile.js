import mongoose from "mongoose";

const LinkedinProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    pageId: { type: String, required: true }, // LinkedIn URN (e.g., urn:li:person:123 or urn:li:organization:456)
    /** Numeric LinkedIn organization id (e.g. 31559073), parsed from the URN. */
    orgId: { type: String, default: "" },
    pageName: { type: String, required: true }, // display name (mirrors localizedName)
    /** localizedName from the LinkedIn organization API. */
    localizedName: { type: String, default: "" },
    /** vanityName (the public handle, e.g. "mannubhaiserviceexpert"). */
    vanityName: { type: String, default: "" },
    image: { type: String }, // profile picture or company logo URL
    email: { type: String }, // optional, for personal profiles
    pageAccessToken: { type: String, required: true },
    pageTokenExpiresAt: { type: Date },
    platform: { type: String, default: "linkedin" },
    type: {
      type: String,
      enum: ["profile", "organization"],
      default: "profile",
    },
    /** Chatbot / WhatsApp flow user phone (digits), same idea as FacebookPage.phone */
    phone: { type: String, default: "" },
    /** "manual" (dashboard OAuth) vs "chatbot" (connect-business / WhatsApp flow) */
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true },
);

/**
 * A user can connect multiple pages, but the same page must not be duplicated
 * for the same user. Different pages (different pageId) are allowed.
 */
LinkedinProfileSchema.index({ userId: 1, pageId: 1 }, { unique: true });

export default mongoose.models.LinkedinProfile ||
  mongoose.model("LinkedinProfile", LinkedinProfileSchema);
