// models/ScraperData.js

import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      index: true, // business name index
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },

    mapUri: {
      type: String,
      default: "",
    },

    placeId: {
      type: String,
      default: "",
      index: true,
    },
  },
  { _id: true }
);

const ScraperDataSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true, // category index
    },

    data: {
      type: [BusinessSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ScraperDataSchema.index({ category: 1 });
ScraperDataSchema.index({ "data.businessName": 1 });
ScraperDataSchema.index({ category: 1, "data.businessName": 1 });

export default mongoose.models.ScraperData ||
  mongoose.model("ScraperData", ScraperDataSchema);