import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // ✅ remove unique:true
    aiOutput: { type: String }, // AI image or video URL
    /** When set with a still image in aiOutput, both image + video tabs are shown. */
    videoOutput: { type: String, default: "" },
    videoPrompt: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    description: { type: String },
    promat: { type: String },
    gmbDescription: { type: String },
    fbDescription: { type: String },
    igDescription: { type: String },


    scheduledDateSource: {
      type: [String],
      enum: ["gmb", "fb", "ig"],
      // required: true,
    },



    status: {
      type: String,
      enum: ["pending", "approved", "scheduled", "processing", "posted", "rejected", "failed"],
      default: "pending",
    },
    approvedMediaType: {
      type: String,
      enum: ["image", "video", "both"],
      default: "both",
    },

    whenPosted: {
      type: Object,
      default: () => ({})
    },

    fbPages: [],
    igPages: [],

    scheduledDate: { type: Date },
    /** When set, automation-fill-queue generates image+copy at this time; then status → scheduled for publish-scheduled. */
    generateContentAt: { type: Date },
    /** True for rows created by user-settings “delay generate + publish” pipeline (safe to replace on re-save). */
    automationQueued: { type: Boolean, default: false },
    automationPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "AutomationPlan", default: null },
    rejectReason: { type: String, default: "" },
    error: { type: String, default: "" },
    facebookPostId: { type: String, default: "" },
    facebookPageAccessToken: { type: String, default: "" },
    accessToken: { type: String }, // Store token at schedule time
    refreshToken: { type: String }, // Store refresh token for cron jobs
    checkmark: { type: String, default: "both" }, // ✅ Added checkmark field

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
