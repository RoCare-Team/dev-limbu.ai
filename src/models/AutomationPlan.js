import mongoose from "mongoose";

const automationPlanSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
    },
    userRef: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    active: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    
    // Core automation settings
    automationEnabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'alternate', 'weekly', 'monthly', 'custom'],
      default: 'daily',
    },
    keywords: [{ type: String }],
    topic: { type: String, default: '' },
    /** GMB-style business description (automation / AI optimization UI). */
    businessProfileDescription: { type: String, default: '' },
    imageConfig: {
      colourPalette: { type: String, default: 'none' },
      size: { type: String, default: '3:4' },
      characterImage: { type: String, default: null },
      uniformImage: { type: String, default: null },
      productImage: { type: String, default: null },
      backgroundImage: { type: String, default: null },
      logoImage: { type: String, default: null },
      // When false, cron sends empty slot to aiAssetsGenerate (user chose not to use that asset).
      includeInGeneration: {
        characterImage:  { type: Boolean, default: true },
        uniformImage:    { type: Boolean, default: true },
        productImage:    { type: Boolean, default: true },
        backgroundImage: { type: Boolean, default: true },
        logoImage:       { type: Boolean, default: true },
      },
    },

    // Pre-generated image+copy for the next publish run (phase=prefetch cron fills this).
    prefetchPost: {
      publishOn:  { type: Date },
      imageUrl:   { type: String, default: '' },
      postText:   { type: String, default: '' },
      keyword:    { type: String, default: '' },
      generatedAt:{ type: Date },
    },
    platforms: [{ 
      type: String, 
      enum: ['gmb', 'fb', 'ig'],
      default: ['gmb']
    }],

    /** When set (0–23), crons only act in this local window. Unset = no hour gate (legacy). */
    postingHour:     { type: Number },
    postingMinute: { type: Number, default: 0 },
    postingTimezone: { type: String, default: 'Asia/Kolkata' },
    /** Minutes before publish to generate image+copy (1440 = same time previous day; 5 = test mode). */
    prefetchOffsetMinutes: { type: Number, default: 1440 },
    startDate: { type: Date },
    endDate: { type: Date },
    skippedDates: [{ type: String }],
    schedule: [{ type: Date }],
    lastPostDate: { type: Date },
    postIndex: { type: Number, default: 0 },
    
    
    // Business info
    businessName: { type: String, default: '' },
    selectedBusiness: { type: mongoose.Schema.Types.Mixed, default: null },
    gmbProjectId: { type: String, default: null },

    // Selected GMB locations to post to (each entry = one physical location)
    locations: [{
      locationId:  { type: String },   // GMB location ID (e.g. "505165208589849995")
      accountId:   { type: String },   // GMB account ID  (e.g. "100262617409791423070")
      name:        { type: String },   // Display name
      address:     { type: String },
      locality:    { type: String },
      websiteUrl:  { type: String, default: '' },
      isVerified:  { type: Boolean, default: false },
     
      isPosted:    { type: Boolean, default: false },
    }],

    accessToken:  { type: String },
    refreshToken: { type: String },

    // Facebook pages selected for automation
    // Shape mirrors what /api/facebook/pages returns + caption field
    fbPages: [{
      pageId:           { type: String },
      pageName:         { type: String },
      pageAccessToken:  { type: String },
    }],

    // Instagram accounts selected for automation
    igPages: [{
      igId:            { type: String },
      igUsername:      { type: String },
      pageAccessToken: { type: String },
    }],

    /**
     * legacy / unset — existing prefetch + automation-plans crons.
     * delay_generate_publish — posts live in Post collection: generateContentAt (+10m chain) then publish +12h via crons.
     */
    postQueueMode: { type: String, enum: ['legacy', 'delay_generate_publish'], default: 'legacy' },

    // Plan metadata
    planDetails: {
      package: { type: String },
      planDuration: { type: String },
      limit: { type: Number },
      postsUsed: { type: Number, default: 0 },
      remaining: { type: Number },
      expiryDate: { type: Date }
    }
  },
  { 
    timestamps: true,
  }
);

// Ensure only 1 active plan per user (pre-save hook)
automationPlanSchema.pre('save', async function(next) {
  if (this.active) {
    await mongoose.model('AutomationPlan').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { active: false } }
    );
  }
  next();
});

automationPlanSchema.index({ userId: 1, active: 1 });

export default mongoose.models.AutomationPlan || mongoose.model("AutomationPlan", automationPlanSchema);
