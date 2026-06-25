import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true },
    locationId: { type: String, required: true },
    title: { type: String },
    categories: { type: mongoose.Schema.Types.Mixed },
    autoReply: { type: Boolean, default: false },
  },
  { _id: false }
);

const AccountSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true },
    autoReply: { type: Boolean, default: false },
    locations: { type: [LocationSchema], default: [] },
  },
  { _id: false }
);

const AutoReplySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  refreshToken: { type: String, required: true },
  accounts: { type: [AccountSchema], default: [] },
  locations: { type: [LocationSchema], default: [] },
  autoReply: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AutoReply || mongoose.model("AutoReply", AutoReplySchema);
