import mongoose from "mongoose";

const FranchisePanelSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "franchise",
    },

    referCode: {
      type: String,
      required: true,
      unique: true, // Limbu25
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchisePanel",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FranchisePanel ||
  mongoose.model("FranchisePanel", FranchisePanelSchema);
