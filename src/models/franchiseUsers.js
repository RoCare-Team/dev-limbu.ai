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


// NOTE: model ka naam "Admin" NAHI hona chahiye — models/Admin.js already us
// naam se register karta hai, aur jo file pehle import hoti hai wahi jeet jaati
// hai. Us collision se agent list (role:"agent") galat schema se query hoti.
export default mongoose.models.FranchiseUser ||
  mongoose.model("FranchiseUser", franchiseAdminSchema, "admins");
  
