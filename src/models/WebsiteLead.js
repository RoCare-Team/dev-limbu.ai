import mongoose from "mongoose";

/**
 * Stores contact-form submissions coming from a generated business website.
 * Each lead is linked to the Site it was submitted from (slug + ownerUserId)
 * so the business owner can view all enquiries for their website.
 */
const WebsiteLeadSchema = new mongoose.Schema(
  {
    // Which website this lead belongs to
    slug: { type: String, required: true, index: true },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      default: null,
    },
    // Owner of the site (so the dashboard can filter leads per user)
    ownerUserId: { type: String, default: "", index: true },
    businessName: { type: String, default: "" },

    // Submitted fields
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    service: { type: String, default: "" },
    message: { type: String, default: "" },

    // Lead lifecycle
    source: { type: String, default: "website-contact-form" },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "spam"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.models.WebsiteLead ||
  mongoose.model("WebsiteLead", WebsiteLeadSchema);
