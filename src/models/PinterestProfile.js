import mongoose from "mongoose";

const PinterestProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    
    // User Profile Data
    pinterestUserId: { type: String, required: true },
    username: String,
    profileImage: String,
    websiteUrl: String,
    accountType: String,
    
    // Boards & Pins Data
    boards: [
      {
        boardId: String,
        boardName: String,
        boardUrl: String,
        description: String,
        pins: { type: Array, default: [] }, // Array of pin objects inside each board
      }
    ],

    // Auth Tokens
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    platform: { type: String, default: "pinterest" },
  },
  { timestamps: true }
);

export default mongoose.models.PinterestProfile ||
  mongoose.model("PinterestProfile", PinterestProfileSchema);
