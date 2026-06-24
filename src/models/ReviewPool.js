import mongoose from "mongoose";

const ReviewItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const ReviewPoolSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    business_name: { type: String, default: "" },
    reviews: { type: [ReviewItemSchema], default: [] },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ReviewPool ||
  mongoose.model("ReviewPool", ReviewPoolSchema);
