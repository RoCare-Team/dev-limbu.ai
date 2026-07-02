import mongoose from "mongoose";

/**
 * A single Google Business Profile category (from the Business Information
 * `categories.list` catalog), cached in Mongo per region + language. `name` is the
 * stable `gcid:...` id used when PATCHing a location's categories; `tokens` are the
 * meaningful words of the display name, used for name-similarity suggestions.
 *
 * Populated by scripts/sync-gmb-categories.mjs.
 */
const GmbCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // gcid:... (no "categories/" prefix)
    displayName: { type: String, required: true },
    displayNameLower: { type: String, required: true },
    tokens: { type: [String], default: [] },
    regionCode: { type: String, required: true },
    languageCode: { type: String, required: true, default: "en" },
  },
  { timestamps: true, collection: "gmbcategories" }
);

// One row per category per region+language.
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, name: 1 }, { unique: true });
// Substring search on the name.
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, displayNameLower: 1 });
// Multikey index for token-overlap similarity queries.
GmbCategorySchema.index({ regionCode: 1, languageCode: 1, tokens: 1 });

export default mongoose.models.GmbCategory ||
  mongoose.model("GmbCategory", GmbCategorySchema);
