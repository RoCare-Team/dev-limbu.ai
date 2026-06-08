import mongoose from "mongoose";

const InhousePinterestMappingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    locationId: { type: String, required: true },
    accountId: { type: String, default: "" },
    locationName: String,
    locality: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    websiteUri: { type: String, default: "" },
    visitUri: { type: String, default: "" },
    pinterestProfileId: String,
    boardId: String,
    boardName: String,
  },
  { timestamps: true },
);

InhousePinterestMappingSchema.index(
  { userId: 1, locationId: 1 },
  { unique: true },
);

export default mongoose.models.InhousePinterestMapping ||
  mongoose.model("InhousePinterestMapping", InhousePinterestMappingSchema);
