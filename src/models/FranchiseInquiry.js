import mongoose from "mongoose";

const FranchiseInquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },

    professionalStatus: { type: String, default: "" },
    investmentCapacity: { type: String, default: "" },

    about: { type: String, default: "" },

    // Legacy admin assignment (super-admin side)
    assignedFranchiseAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // ── Franchise tracking ──────────────────────────────────────
    // The franchise code used when the form was filled (e.g. FD004)
    franchiseCode: { type: String, default: null, index: true },

    // ObjectId of the FranchisePanel document that owns this code
    franchisePanelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchisePanel",
      default: null,
    },

    // ── Sales Executive (SESI) tracking ────────────────────────
    // Referral code of the Sales Executive / agent who shared the link
    salesExecutiveReferralCode: { type: String, default: null },

    // ObjectId of the FranchiseTeam member (agent/SESI)
    salesExecutiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchiseTeam",
      default: null,
    },

    // Denormalised name for quick display without populate
    salesExecutiveName: { type: String, default: null },

    // ── Source metadata ─────────────────────────────────────────
    // "franchise_code" | "sales_executive" | "direct"
    sourceType: {
      type: String,
      enum: ["franchise_code", "sales_executive", "direct"],
      default: "direct",
    },

    // ── Payment / plan info (from franchise-opportunities form) ─
    plan: { type: String, default: null },
    paymentId: { type: String, default: null },
    orderId: { type: String, default: null },
    amount: { type: Number, default: null },
    gstNumber: { type: String, default: null },

    // Lead status
    status: {
      type: String,
      enum: ["pending", "contacted", "converted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.FranchiseInquiry ||
  mongoose.model("FranchiseInquiry", FranchiseInquirySchema);
