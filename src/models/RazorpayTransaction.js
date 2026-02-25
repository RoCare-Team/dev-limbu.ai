import mongoose from "mongoose";

const RazorpayTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    orderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    amount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    gstin: { type: String },
    referCode: {type: String}
  },
  { timestamps: true }
);

export default mongoose.models.RazorpayTransaction || mongoose.model("RazorpayTransaction", RazorpayTransactionSchema);