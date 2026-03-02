import mongoose from "mongoose";

const ROLE_PERMISSIONS = {
  franchisePanelSuperAdmin: {
    manageUsers: false,
    manageTeam: false,
    manageLeads: false,
  },
  franchiseAgent: {
    manageUsers: true,
    manageTeam: false,
    manageLeads: true
  },
  
};

const franchiseAdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    mobile: { type: String },

    role: {
      type: String,
      enum: [
        "franchisePanelSuperAdmin",
        "franchiseAgent"
          ],
      required: true,
    },

    // 🔥 Franchise always points to franchiseAdmin (_id)


    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// auto permissions


export default mongoose.models.Admin ||
  mongoose.model("Admin", franchiseAdminSchema);
  
