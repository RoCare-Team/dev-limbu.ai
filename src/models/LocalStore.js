import mongoose from "mongoose";

/**
 * A Limbu AI franchise partner with a real office, shown as the "Our Store"
 * section on that city's public pages (franchise, GBP management, local SEO).
 *
 * Keyed by `citySlug` — the same slug the city pages use — so one entry lights
 * up every page for that city. Admin fills these from /admin/local-stores.
 */
const LocalStoreSchema = new mongoose.Schema(
  {
    citySlug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /** Display name of the city, e.g. "Kanpur". Falls back to the slug. */
    cityName: { type: String, default: "", trim: true },

    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },

    whatsapp: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },

    /**
     * Optional Google Maps embed URL. Empty means the map is built from the
     * address, which is right for most stores.
     */
    mapUrl: { type: String, default: "", trim: true },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

LocalStoreSchema.index({ citySlug: 1, isActive: 1, order: 1 });

export default mongoose.models.LocalStore ||
  mongoose.model("LocalStore", LocalStoreSchema);
