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
    gridSize: { type: String, default: "" },

    points: { type: [PointSchema], default: [] },

    summary: {
      totalPoints: { type: Number, default: 0 },
      rankedPoints: { type: Number, default: 0 },
      bestRank: { type: Number, default: null },
    },

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
