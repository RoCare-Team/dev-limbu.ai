import mongoose from "mongoose";

const magicQrSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    businessTitle: {
      type: String,
      required: true,
    },
    locality: {
      type: String,
      default: "",
    },
    locationId: {
      type: String,
      required: true,
      unique: true, // A specific Google Location ID should only have one QR code record
    },
    s3ImageUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "failed", "pending"],
      default: "generated",
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MagicQR || mongoose.model("MagicQR", magicQrSchema);
