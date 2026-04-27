import mongoose from "mongoose";

const PricingSchema = new mongoose.Schema(
    {
        // Global Generation Prices
        imageGeneratePrice: { type: Number, default: 80 },
        videoGeneratePrice: { type: Number, default: 200 },

        // Video Platform Prices
        videoGmbPrice: { type: Number, default: 0 },
        videoFbPrice: { type: Number, default: 0 },
        videoInstaPrice: { type: Number, default: 0 },

        // Image Platform Prices
        imageGmbPrice: { type: Number, default: 20 },
        imageFbPrice: { type: Number, default: 0 },
        imageInstaPrice: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Prevent model overwrite issue in Next.js
export default mongoose.models.Pricing || mongoose.model("Pricing", PricingSchema);