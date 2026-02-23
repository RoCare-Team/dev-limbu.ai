import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    fullName: { type: String },
    email: { type: String },
    phone: { type: String, unique: true }, // removed `required: true`

    wallet: { type: Number, default: 0 },
    // imgGeneratePrice: {default: 80, type: Number},
    // igPrice: {type:Number, default: 0},
    // fbPrice: {type: Number, default: 0},
    // gmbPrice: {type: Number, default: 20},
    freeUsedCount: { type: Number },
    GstNumber: { type: String },
    Remarks: { type: String },
    paidService:{type: String},
    paidPackage: {type: String},
    planDuration: {type: String},
leadStage: {
  type: String,
  enum: ["Active", "Follow Up", "Inactive", "Onboard"],
  default: "Active",
},
leadStatus: {
  type: String,
  enum: ["Hot", "Warm", "Cold", ""],
  default: "",
},

    referCode : {type: String},
    assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
    remarksHistory: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now },
      }
    ],
    
    subscription: {
      plan: { type: String },
      paymentId: { type: String },
      orderId: { type: String },
      date: { type: Date },
      expiry: { type: Date },
      status: { type: String, enum: ["active", "inactive"], default: "inactive" },
      maxAccounts: { type: Number, default: 0 },
      accounts: [
        {
          googleId: String,
          email: String,
          listingData: Object,
        },
      ],
    },

     source: {
      type: String,
      enum: ["signup", "bulk-upload", "csv-import", "excel-import"],
      default: "signup",
    },

    connectedBusinessEmail: { type: String, default: null },
  isBusinessConnected: { type: Boolean, default: false },
  isServiceBooked: { type: Boolean, default: false },

    // Store OTP temporarily for verification
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
