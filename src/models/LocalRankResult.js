import mongoose from "mongoose";

/**
 * One saved snapshot of a Local Rank Tracker audit.
 *
 * Stores the full webhook grid data (per-point competitors + the business rank)
 * along with the keyword, grid size, business name and userId so the same keyword
 * can be re-tested later and compared against this snapshot.
 */
const CompetitorSchema = new mongoose.Schema(
  {
    rank: Number,
    placeId: String,
    name: String,
    rating: Number,
    reviews: Number,
    address: String,
  },
  { _id: false },
);

const PointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    area: { type: String, default: "" },
    isCenter: { type: Boolean, default: false },
    businessRank: { type: Number, default: null },
    businessFound: { type: Boolean, default: false },
    competitors: { type: [CompetitorSchema], default: [] },
  },
  { _id: false },
);

const LocalRankResultSchema = new mongoose.Schema(
  {
    // Who ran this audit — pulled from the same profile source (useUserProfile)
    // that powers the membership card in AccountDetails, so every snapshot is
    // tied to the real logged-in user, not just a loose localStorage id.
    userId: { type: String, required: true, index: true },
    email: { type: String, default: "", index: true },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    plan: { type: String, default: "" },

    keyword: { type: String, required: true, index: true },
    city: { type: String, default: "" },
    businessName: { type: String, default: "", index: true },
    locationId: { type: String, default: "" },
    // Google Maps place id of the audited business, sent with the rank request.
    placeId: { type: String, default: "", index: true },
    gridSize: { type: String, default: "" },

    points: { type: [PointSchema], default: [] },

    summary: {
      totalPoints: { type: Number, default: 0 },
      rankedPoints: { type: Number, default: 0 },
      bestRank: { type: Number, default: null },
    },

    // `business_average_position` as returned by the webhook.
    averagePosition: {
      type: {
        averageRank: { type: Number, default: null },
        frequency: { type: Number, default: 0 },
        totalGridPoints: { type: Number, default: 0 },
        businessName: { type: String, default: "" },
      },
      default: null,
    },

    // `top_competitors` — grid-wide competitor leaderboard from the webhook.
    topCompetitors: {
      type: [
        {
          _id: false,
          rank: Number,
          name: String,
          score: Number,
          frequency: Number,
          averageRank: Number,
          rating: Number,
          reviews: Number,
        },
      ],
      default: [],
    },

    // ── Updated rich audit (webhook v2) ── flexible Mixed types ──
    // Har keyword ka poora result (keyword, gridPoints, averagePosition, topCompetitors).
    keywordResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Business ke apne GBP details (name, logo, rating, phone, website, hours...).
    businessDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    // Overall (all keywords) average position — average_rank/frequency/total_checks.
    overallAveragePosition: { type: mongoose.Schema.Types.Mixed, default: null },
    // Overall competitor leaderboard (saare keywords ke aar-paar).
    overallTopCompetitors: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // You-vs-competitor gap analysis + verdict.
    comparison: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Improvement suggestions (string list).
    suggestions: { type: [String], default: [] },

    // Keep the original webhook payload too, in case we need richer comparisons later.
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

// Fast lookup of past audits for the same keyword/business/grid when comparing.
LocalRankResultSchema.index({
  userId: 1,
  keyword: 1,
  businessName: 1,
  gridSize: 1,
  createdAt: -1,
});

export default mongoose.models.LocalRankResult ||
  mongoose.model("LocalRankResult", LocalRankResultSchema);
