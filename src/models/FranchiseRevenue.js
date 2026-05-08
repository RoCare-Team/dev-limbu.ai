import mongoose from "mongoose";

const FranchiseRevenueSchema = new mongoose.Schema(
  {
    leadId: { 
      type: String, 
      required: true,
      ref: "MetaLeadFranchises"
    },
    leadName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentScreenshot: { type: String, required: true }, // Cloudinary URL
    
    utrNumber: { type: String, default: "" },
    // Who onboarded this franchise
    onboardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    onboardedByName: { type: String },
    onboardedByRole: { type: String }, // "superAdmin", "franchiseAdmin"
    
    // For tracking which franchise this belongs to
    franchisePanelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchisePanel",
      default: null,
    },
    
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    
    notes: { type: String, default: "" },
    planRemarks: { type: String, default: "" },
    packageExpiryDate :{type: String, default: ""},
    plan: { type: String, default: "" },
    /** user_onboard: superAdmin approves before subscription is activated on the user */
    planApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    type: { type: String, default: "franchise_lead" },
  },
  { timestamps: true }
);

// Index for faster queries
FranchiseRevenueSchema.index({ onboardedBy: 1 });
FranchiseRevenueSchema.index({ leadId: 1 });
FranchiseRevenueSchema.index({ status: 1 });

export default mongoose.models.FranchiseRevenue ||
  mongoose.model("FranchiseRevenue", FranchiseRevenueSchema);
