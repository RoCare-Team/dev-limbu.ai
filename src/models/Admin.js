import mongoose from "mongoose";

const ROLE_PERMISSIONS = {
  superAdmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: true,
    seeAnalytics: true,
  },
  superFranchiseAdmin: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: false,
    manageFranchise: true,
    seeAnalytics: true,
  },
  franchiseAdmin: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: false,
    manageFranchise: true,
    seeAnalytics: false,
  },
  admin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: true,
  },
  subadmin: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  manager: {
    manageUsers: true,
    manageTeam: true,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  agent: {
    manageUsers: true,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
  support: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: true,
    manageFranchise: false,
    seeAnalytics: false,
  },
};

const AdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // Admin-visible copy of the password, only readable via the passkey-guarded API
    plainPassword: { type: String, select: false },
    mobile: { type: String },

    role: {
      type: String,
      enum: [
        "superAdmin",
        "superFranchiseAdmin",
        "franchiseAdmin",
        "admin",
        "subadmin",
        "manager",
        "agent",
        "support",
      ],
      required: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // 🔥 Franchise always points to franchiseAdmin (_id)
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    assignedFranchiseAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    permissions: {
      manageUsers: Boolean,
      manageTeam: Boolean,
      manageLeads: Boolean,
      manageFranchise: Boolean,
      seeAnalytics: Boolean,
    },

    isActive: { type: Boolean, default: true },

    /**
     * Agent ko naye leads milne chahiye ya nahi (auto-assignment ke liye).
     * false → round-robin/least-loaded pool se agent bahar ho jaata hai,
     * lekin login/panel sab normal chalta rehta hai (isActive se alag).
     * Admin RBAC page se aur agent khud apne dashboard se toggle kar sakta hai.
     */
    leadsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// auto permissions
AdminSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("role")) {
    this.permissions = ROLE_PERMISSIONS[this.role] || {};
  }
  next();
});

export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);
