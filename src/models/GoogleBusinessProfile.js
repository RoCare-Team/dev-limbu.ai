import mongoose from "mongoose";

const GoogleBusinessProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    googleId: { type: String, required: true },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, default: "" },
    tokenExpiresAt: { type: Date },
    listings: { type: Array, default: [] },
    platform: { type: String, default: "gmb" },
    type: { type: String, default: "google_business" },
    phone: { type: String, default: "" },
    connectionSource: { type: String, default: "manual" },
  },
  { timestamps: true },
);

GoogleBusinessProfileSchema.index(
  { userId: 1, googleId: 1 },
  { unique: true },
);

export default mongoose.models.GoogleBusinessProfile ||
  mongoose.model("GoogleBusinessProfile", GoogleBusinessProfileSchema);
