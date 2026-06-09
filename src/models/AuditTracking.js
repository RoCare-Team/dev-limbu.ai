

import mongoose from "mongoose";

const AuditTrackingSchema = new mongoose.Schema(
  {
    email: String,
    locationId: String,
    accountId: String,
    businessName: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AuditTracking ||
  mongoose.model("AuditTracking", AuditTrackingSchema);