import mongoose from "mongoose";

const ROLE_PERMISSIONS = {
  superFranchiseAdmin: {
    manageTeam: true,
    manageLeads: true,
    manageUsers: true,
    viewReports: true,
    managePayments: true,
  },
  manager: {
    manageTeam: false,
    manageLeads: true,
    manageUsers: false,
    viewReports: true,
    managePayments: false,
  },
  agent: {
    manageTeam: false,
    manageLeads: true,
    manageUsers: false,
    viewReports: false,
    managePayments: false,
  },
};

const franchiseTeamSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  
// Role in the team
  role: {
    type: String,
    enum: ["superFranchiseAdmin", "manager", "agent"],
    default: "agent",
  },
  
  // Referral code for agents (generated from name)
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  
// Link to franchise (parent) - using franchiseCode string
  franchiseId: {
    type: String,
    required: true,
  },
  
  // Permissions based on role
  permissions: {
    type: Object,
    default: () => ({}),
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Profile fields
  profileImage: { type: String },
  address: { type: String },
  
  // For agent specific
  assignedLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Login tracking
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  
}, { timestamps: true });

// Function to generate referral code from name
franchiseTeamSchema.statics.generateReferralCode = function(fullName) {
  const cleanName = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${random}`;
};

// Pre-save middleware to set permissions based on role
franchiseTeamSchema.pre("save", function(next) {
  if (this.role && ROLE_PERMISSIONS[this.role]) {
    this.permissions = ROLE_PERMISSIONS[this.role];
  }
  next();
});

const FranchiseTeam = mongoose.models.FranchiseTeam || mongoose.model("FranchiseTeam", franchiseTeamSchema);

export default FranchiseTeam;
export { ROLE_PERMISSIONS };
