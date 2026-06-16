import mongoose from "mongoose";

const HomePageDataSchema = new mongoose.Schema(
  {
    heroImage: {
      url: { type: String },
      alt: { type: String },
    },
    clientLogos: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    businessCategories: [
      {
        title: { type: String },
        slug: { type: String },
        image: { type: String },
      },
    ],
    popularCities: [
      {
        name: { type: String },
        slug: { type: String },
        image: { type: String },
      },
    ],
    postImages: [
      {
        url: { type: String },
        type: { type: String, enum: ["user_post", "ai_generated"] },
        label: { type: String }, // sirf ai_generated ke liye
      },
    ],
    videoExamples: [
      {
        url: { type: String },
        label: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.HomePageData ||
  mongoose.model("HomePageData", HomePageDataSchema);
