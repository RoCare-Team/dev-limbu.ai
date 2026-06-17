// models/FranchiseeScrapeData.js

import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
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
  { _id: true },
);

const FranchiseeScrapeDataSchema = new mongoose.Schema(
  {
    franchiseeCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    month: {
      type: Number,
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    data: {
      type: [BusinessSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
FranchiseeScrapeDataSchema.index({
  franchiseeCode: 1,
  year: 1,
  month: 1,
});

FranchiseeScrapeDataSchema.index({
  franchiseeCode: 1,
  category: 1,
});

FranchiseeScrapeDataSchema.index({
  category: 1,
  "data.businessName": 1,
});

export default mongoose.models.FranchiseeScrapeData ||
  mongoose.model("FranchiseeScrapeData", FranchiseeScrapeDataSchema);
