import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    

    // MAIN ROLE
    role: {
      type: String,
      enum: ["admin", "subadmin","franchiseAdmin"],
      default: "admin",
    },

    // SUB-ADMIN PERMISSIONS
    permissions: {
      manageUsers: { type: Boolean, default: false },
      manageReviews: { type: Boolean, default: false },
      managePlans: { type: Boolean, default: false },
      seeAnalytics: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js hot reload
export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
