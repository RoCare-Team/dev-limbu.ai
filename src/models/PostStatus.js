import mongoose from "mongoose";

const platformPostSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["gmb", "facebook", "instagram", "pinterest", "linkedin", "youtube"],
    },
    posted: { type: Boolean, default: false },
    postedDate: { type: Date, default: null },
    postId: { type: String, default: "" },
    error: { type: String, default: "" },
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    aiOutput: { type: String },
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
    liDescription: { type: String },
    piDescription: { type: String },
    ytDescription: { type: String },
    scheduledDateSource: {
      type: [String],
      enum: ["gmb", "fb", "ig", "li", "pi", "yt"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "scheduled",
        "processing",
        "posted",
        "rejected",
        "failed",
      ],
      default: "pending",
    },
    mediaStatus: {
      type: Object,
      default: () => ({}),
    },
    postedPlatform: { type: String, default: "" },

    whenPosted: {
      type: [platformPostSchema],
      default: () => [
        { platform: "gmb",       posted: false, postedDate: null, postId: "", error: "" },
        { platform: "facebook",  posted: false, postedDate: null, postId: "", error: "" },
        { platform: "instagram", posted: false, postedDate: null, postId: "", error: "" },
        { platform: "pinterest", posted: false, postedDate: null, postId: "", error: "" },
        { platform: "linkedin",  posted: false, postedDate: null, postId: "", error: "" },
        { platform: "youtube",   posted: false, postedDate: null, postId: "", error: "" },
      ],
    },

    fbPages: [],
    igPages: [],
    scheduledDate: { type: Date },
    generateContentAt: { type: Date },
    automationQueued: { type: Boolean, default: false },
    automationPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutomationPlan",
      default: null,
    },
    rejectReason: { type: String, default: "" },
    error: { type: String, default: "" },
    facebookPostId: { type: String, default: "" },
    facebookPageAccessToken: { type: String, default: "" },
    accessToken: { type: String },
    refreshToken: { type: String },
    checkmark: { type: String, default: "both" },
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
        apiResponse: Object,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);