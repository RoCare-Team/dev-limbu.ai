import mongoose from "mongoose";

const IconSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // brand | material | image
    value: { type: String, required: true }, // e.g. "google", "bar_chart", https://...
  },
  { _id: false }
);

const ActionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // feature | plans | all_services | url
    value: { type: String, required: true }, // e.g. "gmb_insight", "ads", "seo", https://...
  },
  { _id: false }
);

/**
 * Per-user rules for a tile. The API turns these into access.status / badge
 * for the user who is calling (see homeSection.access.js).
 */
const AccessSchema = new mongoose.Schema(
  {
    // Plan names (as stored on the user) that unlock this tile -> "ACTIVE".
    // Matching ignores case, e.g. ["Professional Plan", "Premium Plan"].
    includedInPlans: { type: [String], default: [] },
    // FREE for every user.
    freeForAll: { type: Boolean, default: false },
    // Free uses for users whose plan does not include the tile. 0 = none.
    freeLimit: { type: Number, default: 0 },
    // Who sees the tile: all | free_users | paid_users
    visibleTo: { type: String, default: "all" },
  },
  { _id: false }
);

/**
 * Length-based coin price for video tiles. The app lets the user pick
 * minSeconds..maxSeconds in steps of stepSeconds and shows
 * total = seconds * coinsPerSecond.
 */
const PricingSchema = new mongoose.Schema(
  {
    coinsPerSecond: { type: Number, required: true },
    minSeconds: { type: Number, default: 10 },
    maxSeconds: { type: Number, default: 60 },
    stepSeconds: { type: Number, default: 10 },
  },
  { _id: false }
);

const HomeSectionItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    icon: { type: IconSchema, required: true },
    badge: { type: String, default: null }, // FREE | NEW | HOT | PRO | null
    action: { type: ActionSchema, required: true },
    access: { type: AccessSchema, default: () => ({}) },
    // Shown but not usable yet -> "COMING SOON", overrides the access rules.
    comingSoon: { type: Boolean, default: false },
    // Coins charged per use (starting price for length-based videos). 0 = no coins.
    coinCost: { type: Number, default: 0 },
    pricing: { type: PricingSchema, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const HomeSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    icon: { type: IconSchema, required: true },
    viewAll: { type: ActionSchema, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    items: { type: [HomeSectionItemSchema], default: [] },
  },
  { timestamps: true }
);

HomeSectionSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.HomeSection ||
  mongoose.model("HomeSection", HomeSectionSchema, "home_sections");
