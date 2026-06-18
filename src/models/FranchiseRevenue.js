import mongoose from "mongoose";

const FranchiseRevenueSchema = new mongoose.Schema(
  {
    leadId: { type: String, default: "" },
    leadName: { type: String, default: "" },
    amount: { type: Number, required: true },
    paymentScreenshot: { type: String, default: "" },
    screenshot: { type: String, default: "" },

    utrNumber: { type: String, default: "" },
    gstNumber: { type: String, default: "" },

    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    // ✅ Mixed type — String ya ObjectId dono accept karega
    onboardedBy: { type: mongoose.Schema.Types.Mixed, default: null },

    onboardedByName: { type: String, default: "" },
    onboardedByRole: { type: String, default: "" },

    franchisePanelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchisePanel",
      default: null,
    },

    franchiseId: { type: String, default: null },
    franchiseName: { type: String, default: null },
    bookingSource: {
      type: String,
      enum: ["website", "chatbot", "manual-upload"],
      default: "website",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "user_onboard"],
      default: "active",
    },

    notes: { type: String, default: "" },
    planRemarks: { type: String, default: "" },
    packageStartDate: { type: Date, default: null },
    packageExpiryDate: { type: Date, default: null },
    plan: { type: String, default: "" },
    planApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    type: { type: String, default: "franchise_lead" },
    invoiceUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

FranchiseRevenueSchema.index({ leadId: 1 });
FranchiseRevenueSchema.index({ status: 1 });
FranchiseRevenueSchema.index({ franchiseId: 1 });

// ✅ Purana cached model force delete
delete mongoose.models.FranchiseRevenue;

export default mongoose.model("FranchiseRevenue", FranchiseRevenueSchema);
