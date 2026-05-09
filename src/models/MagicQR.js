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
    reviewUrl: {
      type: String,
      default: "",
    },
    /** 0 = legacy; MAGIC_QR_SERVER_CARD_VERSION = server render; MAGIC_QR_CLIENT_UPLOAD_VERSION = client upload */
    cardGeneratorVersion: {
      type: Number,
      default: 0,
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
