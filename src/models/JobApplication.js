

import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: Number,
    jobTitle: String,
    fullName: String,
    email: String,
    phone: String,
    linkedin: String,
    resumeUrl: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.JobApplication ||
  mongoose.model("JobApplication", JobApplicationSchema);