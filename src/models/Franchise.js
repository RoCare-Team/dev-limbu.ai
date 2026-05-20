import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    installment: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentId: {
      type: String,
    },

    orderId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paidAt: {
      type: Date,
    },
  },
  { _id: false }
);

const FranchiseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
    },

    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
    },

    userEmail: {
      type: String,
    },

    city: {
      type: String,
      required: [true, "Please provide a city"],
    },

    experience: {
      type: String,
    },

    investment: {
      type: String,
      required: [true, "Please provide investment capacity"],
    },

    message: {
      type: String,
    },

    // overall franchise status
    status: {
      type: String,

      enum: [
        "pending",
        "partial_paid",
        "paid",
        "failed",
      ],

      default: "pending",
    },

    // total amount
    totalAmount: {
      type: Number,
    },

    // all installment payments
    payments: [PaymentSchema],

    plan: String,

    gstNumber: String,

    leadType: {
      type: String,
      default: "Website",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Franchise ||
  mongoose.model("Franchise", FranchiseSchema);