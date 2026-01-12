import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // ✅ remove unique:true
    aiOutput: { type: String }, // AI image URL
    description:{type: String},
    promat:{type:String},
    gmbDescription:{type:String},
    fbDescription:{type:String},
    igDescription:{type:String},
    

    status: {
      type: String,
      enum: ["pending", "approved", "scheduled", "processing", "posted", "rejected", "failed"],
      default: "pending",
    },
    
    
    scheduledDate: { type: Date },
    rejectReason: { type: String, default: "" },
    accessToken: { type: String }, // Store token at schedule time
    refreshToken: { type: String }, // Store refresh token for cron jobs
    checkmark: { type: String, default: "post" }, // ✅ Added checkmark field
    
    locations: [
      {
        locationId: String,
        accountId: String,
        name: String,
        address: String,
        city: String,
        locality: String,
        websiteUrl: String,
        isPosted: { type: Boolean, default: false },
        error: String,
        postedAt: Date,
        apiResponse: Object
      }
    ],

  },
  { timestamps: true }
);


export default mongoose.models.Post || mongoose.model("Post", PostSchema);
