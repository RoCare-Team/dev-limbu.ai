import mongoose from "mongoose";

const MetaSyncSchema = new mongoose.Schema(
  {
    formId: {
      type: String,
      required: true,
      unique: true,
    },

    lastAfterCursor: {
      type: String,
      default: null,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js
export default mongoose.models.MetaSync ||
  mongoose.model("MetaSync", MetaSyncSchema);
