import mongoose from "mongoose";

const SiteSchema = new mongoose.Schema(
  {
    slug: { 
      type: String, 
      unique: true, 
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, // Only alphanumeric and hyphens
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    locationId: {
      type: String,
      required: false,
    },
    business: {
      type: Object,
      required: true,
    },
    aiContent: {
      type: Object,
      required: true,
    },
    mediaImages: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    customDomain: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    metadata: {
      title: String,
      description: String,
      ogImage: String,
      contactEmail: String,
    },
    analytics: {
      views: { type: Number, default: 0 },
      lastVisited: Date,
    },
  },
  { 
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { slug: 1 },
      { customDomain: 1 },
    ],
  }
);

// Prevent duplicate index errors
SiteSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Site || mongoose.model("Site", SiteSchema);
