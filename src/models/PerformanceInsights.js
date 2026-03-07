import mongoose from "mongoose";

const PerformanceInsightsSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    businessProfileId: {
      type: String,
      required: true,
    },
    insightsData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    searchKeywords: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metrics: {
      totalDirections: {
        type: Number,
        default: 0,
      },
      totalCalls: {
        type: Number,
        default: 0,
      },
      totalWebsiteClicks: {
        type: Number,
        default: 0,
      },
      totalMapsImpressions: {
        type: Number,
        default: 0,
      },
      totalSearchImpressions: {
        type: Number,
        default: 0,
      },
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    reportMonth: {
      type: String,
      required: true,
    },
    reportYear: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PerformanceInsightsSchema.index({ locationId: 1, userId: 1, reportMonth: 1, reportYear: 1 });

export default mongoose.models.PerformanceInsights ||
  mongoose.model("PerformanceInsights", PerformanceInsightsSchema);
