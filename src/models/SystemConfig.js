import mongoose from "mongoose";

const SystemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: "We are performing scheduled maintenance. Please check back shortly.",
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.SystemConfig ||
  mongoose.model("SystemConfig", SystemConfigSchema);
