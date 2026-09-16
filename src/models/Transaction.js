import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true 
    },

    // credit = add coins
    // debit = deduct coins
    type: { 
      type: String, 
      enum: ["credit", "debit"], 
      required: true 
    },

    amount: { 
      type: Number, 
      required: true 
    }, // always positive number

    balanceAfter: { 
      type: Number, 
      required: true 
    },

    // WHY the transaction happened?
   reason: {
  type: String,
  default: "other",
},


    // Extra info (everything dynamic)
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Wallet history is always read per user, newest first — without this every
// Vault Logs open scanned the whole collection.
TransactionSchema.index({ userId: 1, createdAt: -1 });

// Prevent model compile errors
export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
