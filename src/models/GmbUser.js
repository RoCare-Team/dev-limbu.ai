import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  googleId: String,
  accessToken: String,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date,
});
const GmbUserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: String,
  image: String,
  projects: [ProjectSchema],
});


export default mongoose.models.GmbUser || mongoose.model("GmbUser", GmbUserSchema);
