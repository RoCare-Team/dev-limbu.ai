import mongoose from "mongoose";

const ApiRequestLogSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    method: { type: String, required: true },
    status: { type: Number, required: true },
    success: { type: Boolean, default: false },
    durationMs: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.ApiRequestLog ||
  mongoose.model("ApiRequestLog", ApiRequestLogSchema);
