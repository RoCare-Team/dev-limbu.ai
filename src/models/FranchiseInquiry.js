import mongoose from "mongoose";

const FranchiseInquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },

    professionalStatus: { type: String, required: true },
    investmentCapacity: { type: String, required: true },

    about: { type: String, default: "" },

    assignedFranchiseAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FranchiseInquiry ||
  mongoose.model("FranchiseInquiry", FranchiseInquirySchema);
