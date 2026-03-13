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
    
    // Package start and expiry dates
    packageStartDate: { type: Date },
    packageExpiryDate: { type: Date },
    
    // Payment screenshot for plan upgrades
    paymentScreenshot: { type: String, default: null },
    
    // UTR Number for payment tracking
    utrNumber: { type: String, unique: true, sparse: true },
    
    // Service start and expiry dates
    serviceStartDate: { type: Date },
    serviceExpiryDate: { type: Date },
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
accountManager: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  default: null,
},
accountManagerName: {
  type: String,
  default: null,
},

referCode : {type: String},
    // Franchise and agent referral tracking
    franchiseId: { type: String, default: null },
    referredByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "FranchiseTeam", default: null },
    referredByAgentName: { type: String, default: null },
    assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
    
    // Call Tracking Fields
    callCount: { type: Number, default: 0 },
    callHistory: [
      {
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        agentName: { type: String },
        calledAt: { type: Date, default: Date.now },
        remark: { type: String },
      }
    ],
    
remarksHistory: [
      {
        text: String,
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        agentName: { type: String },
        calledAt: { type: Date, default: Date.now },
        messageSent: { type: Boolean, default: false },
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
