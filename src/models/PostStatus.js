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
    pinTitle: {type:String},
    ytDescription: { type: String },
    scheduledDateSource: {
      type: [String],
      enum: ["gmb", "fb", "ig", "li", "pin", "yt"],
    },
    status: {
      type: String,
      enum: [

        "pending",
        "approved",
        "scheduled",
        "processing",
        "posted",
        "partial_failed",
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

    // ── Publish reliability (publish-scheduled cron) ─────────────────────────
    // Pehle `processing` ek TARAF ka darwaza tha: cron post ko "processing"
    // mark karta tha, aur agar wo run beech me mar jaye (server restart, PM2
    // memory restart, nginx timeout) to post hamesha ke liye wahin atak jata —
    // kyunki cron sirf `status: "scheduled"` dhoondta hai. Un profiles ka post
    // chup-chaap kabhi nahi jata. `processingSince` se stale claim reclaim hoti
    // hai. `publishAttempts` + `nextRetryAt` se failed / partial_failed post
    // bounded backoff ke saath khud retry hota hai (pehle sirf manual retry
    // button se hota tha, isliye ek transient GMB error = us din ka post gaya).
    processingSince: { type: Date, default: null },
    publishAttempts: { type: Number, default: 0 },
    nextRetryAt: { type: Date, default: null },

    rejectReason: { type: String, default: "" },
    error: { type: String, default: "" },
    facebookPostId: { type: String, default: "" },
    facebookPageAccessToken: { type: String, default: "" },
    accessToken: { type: String },
    refreshToken: { type: String },
    checkmark: { type: String, default: "both" },
    gmbPostMeta: {
      postType: { type: String, default: "standard" },
      ctaType: { type: String, default: "book" },
      customUrl: { type: String, default: "" },
      eventTitle: { type: String, default: "" },
      startDate: { type: String, default: "" },
      endDate: { type: String, default: "" },
    },
    locations: [
      {
        locationId: String,
        accountId: String,
        name: String,
        address: String,
        city: String,
        locality: String,
        websiteUrl: String,
        primaryPhone: String,
        isPosted: { type: Boolean, default: false },
        error: String,
        postedAt: Date,
        apiResponse: Object,
        // Per-location audit trail. `isPosted` batata hai ki post gaya ya nahi,
        // par "kitni baar koshish hui aur aakhri baar kab / kyun failed" pehle
        // kahin record nahi hota tha — isliye 125-location wale post me ye
        // batana mushkil tha ki kaunsi location abhi bhi baaki hai aur kyun.
        attempts: { type: Number, default: 0 },
        lastAttemptAt: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

// Hot-reload / stale-model guard: agar cached model me naye field nahi hain to
// use girao, warna dev me purana schema chipka reh jata hai aur naye field
// silently drop ho jaate hain.
if (
  mongoose.models.Post &&
  (!mongoose.models.Post.schema.path("gmbPostMeta") ||
    !mongoose.models.Post.schema.path("processingSince"))
) {
  delete mongoose.models.Post;
}

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
