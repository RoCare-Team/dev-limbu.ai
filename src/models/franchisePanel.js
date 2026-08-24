import mongoose from "mongoose";

const FranchisePanelSchema = new mongoose.Schema(
  {
    franchiseName: { type: String, required: true },
    wallet: { type: Number, default: 500 },
    ownerName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Admin-visible copy of the password, only readable via the passkey-guarded API
    plainPassword: { type: String, select: false },
    franchiseCode: { type: String, required: true, unique: true },
    role: { type: String, default: "franchise" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.FranchisePanel ||
  mongoose.model("FranchisePanel", FranchisePanelSchema);
