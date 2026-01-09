import mongoose from "mongoose";

const HomeDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'postImages',
        'videoExamples',
        'servicePlans',
        'testimonials',
        'slidingTexts',
        'subscriptionPlans',
        'features',
        'stats',
        'steps'
      ],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.HomeData || mongoose.model("HomeData", HomeDataSchema);