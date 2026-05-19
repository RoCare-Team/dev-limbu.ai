// models/CoinPrice.js

import mongoose from "mongoose";

const CoinPriceSchema = new mongoose.Schema(
  {
    // Actual amount user enters
    price: {
      type: Number,
      required: true,
    },

    // Coins user gets
    coins: {
      type: Number,
      required: true,
    },

    // GST percentage
    gst_percentage: {
      type: Number,
      default: 18,
    },

    // Final amount after GST
    gst_price: {
      type: Number,
      required: true,
    },

    // ISO / international price
    iso_price: {
      type: Number,
      required: true,
    },

    // Optional bonus coins
    bonus_coins: {
      type: Number,
      default: 0,
    },

    // Popular tag
    popular: {
      type: Boolean,
      default: false,
    },

    // Active or not
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto calculate GST + ISO price
CoinPriceSchema.pre("validate", function (next) {
  const gst = (this.price * this.gst_percentage) / 100;

  // Final payable amount
  this.gst_price = Number((this.price + gst).toFixed(2));

  // Same as current price for now
  this.iso_price = this.price;

  next();
});

export default mongoose.models.CoinPrice ||
  mongoose.model("CoinPrice", CoinPriceSchema);
