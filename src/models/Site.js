import mongoose from "mongoose";

const SiteSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },

  userId: { type: String, required: true },

  locationId: { type: String },

  business: { type: Object, required: true },

  aiContent: { type: Object, required: true },

  /** schema.org LocalBusiness JSON-LD object injected on the live page for SEO */
  schemaData: { type: Object, default: null },

  mediaImages: { type: [String], default: [] },

  isPublished: { type: Boolean, default: true },

  /** e.g. "chatbot" when published via WhatsApp chatbot; manual flows omit this */
  type: { type: String },

  customDomain: { type: String, unique: true, sparse: true },

  analytics: {
    views: { type: Number, default: 0 },
    lastVisited: { type: Date, default: Date.now }
  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now }

});

export default mongoose.models.Site || mongoose.model("Site", SiteSchema);