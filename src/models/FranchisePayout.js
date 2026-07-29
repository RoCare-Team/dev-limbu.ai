import mongoose from "mongoose";

/**
 * A payout settled BY the platform TO a franchise against its revenue share.
 * Kept separate from FranchiseRevenue (money coming in) so the franchise panel
 * can show "earned vs paid vs pending" without mixing the two ledgers.
 */
const FranchisePayoutSchema = new mongoose.Schema(
  {
    franchiseCode: { type: String, required: true, trim: true },
    franchiseName: { type: String, default: "" },

    amount: { type: Number, required: true },

    paymentMode: {
      type: String,
      enum: ["bank-transfer", "upi", "cash", "cheque", "other"],
      default: "bank-transfer",
    },

    /** UTR / cheque number / transaction reference */
    referenceNo: { type: String, default: "" },

    /** S3 URL of the transfer screenshot — the proof shown to the franchise */
    screenshot: { type: String, default: "" },

    notes: { type: String, default: "" },

    /** Optional settlement window this payout covers */
    periodFrom: { type: Date, default: null },
    periodTo: { type: Date, default: null },

    paidAt: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["paid", "reversed"],
      default: "paid",
    },

    createdByEmail: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

FranchisePayoutSchema.index({ franchiseCode: 1, paidAt: -1 });
FranchisePayoutSchema.index({ status: 1 });

export default mongoose.models.FranchisePayout ||
  mongoose.model("FranchisePayout", FranchisePayoutSchema);
