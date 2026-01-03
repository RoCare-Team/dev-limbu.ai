import mongoose from "mongoose";

const FacebookPageSchema = new mongoose.Schema(
  {
    pageId: String,
    pageName: String,
    pageAccessToken: String,
    platform: String, // facebook
  },
  { timestamps: true }
);

export default mongoose.models.FacebookPage ||
  mongoose.model("FacebookPage", FacebookPageSchema);
