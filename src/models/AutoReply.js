import mongoose from "mongoose";


const AutoReplySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  refreshToken: { type: String, required: true }, // store Google token
  locations: { type: Array, required: true }, // [{accountId, locationId}]
  autoReply: { type: Boolean, default: false,required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.AutoReply || mongoose.model("AutoReply", AutoReplySchema);
