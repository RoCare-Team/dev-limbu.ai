import mongoose from "mongoose";

const SiteSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },

  userId: { type: String, required: true },

  locationId: { type: String },

  business: { type: Object, required: true },

  aiContent: { type: Object, required: true },

  mediaImages: { type: [String], default: [] },

  isPublished: { type: Boolean, default: true },

  customDomain: { type: String, unique: true, sparse: true },

  analytics: {
    views: { type: Number, default: 0 },
    lastVisited: { type: Date, default: Date.now }
  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now }

});

export default mongoose.models.Site || mongoose.model("Site", SiteSchema);