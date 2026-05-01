import mongoose from "mongoose";

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

    scheduledDateSource: {
      type: [String],
      enum: ["gmb", "fb", "ig"],
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

    approvedMediaType: {
      type: String,
      enum: ["image", "video", "both"],
    },

    rejectedMediaType: {
      type: String,
      enum: ["image", "video", "both"],
    },

    whenPosted: {
      type: Object,
      default: () => ({}),
    },
    platformPosted: {
      type: Object,
      default: () => ({}),
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