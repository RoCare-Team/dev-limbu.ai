import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    fullName: { type: String },
    email: { type: String },
    phone: { type: String, unique: true }, // removed `required: true`

    /** WhatsApp chatbot (LimbuBot) identity — e.g. wa_919876543210 */
    chatbotUserId: { type: String, default: null, sparse: true },
    whatsappUserId: { type: String, default: null },
    limbuBotUserId: { type: String, default: null },
    chatbotLastActive: { type: String, default: null },
    chatbotMessageCount: { type: Number, default: null },
    chatbotLastMessage: { type: String, default: null },
    /** Cached LimbuBot funnel stages (updated on WhatsApp sync) */
    conversationStages: { type: [String], default: [] },
    chatbotStagesSyncedAt: { type: Date, default: null },

  //   paidSession: [
  //   {
  //     serviceName: String,
  //     amount: Number,
  //     date: { type: Date, default: Date.now }
  //   }
  // ],

    wallet: { type: Number, default: 0 },
    // imgGeneratePrice: {default: 80, type: Number},
    // igPrice: {type:Number, default: 0},
    // fbPrice: {type: Number, default: 0},
    // gmbPrice: {type: Number, default: 20},
    freeUsedCount: { type: Number },
    GstNumber: { type: String },
    Remarks: { type: String },
    paidService: { type: String},
    paidPackage: { type: String },
    planDuration: { type: String },
    amount: { type: Number },
    planApprovalStatus: { type: String, default: "pending" },
    // Package start and expiry dates
    packageStartDate: { type: Date },
    packageExpiryDate: { type: Date },

    // Payment screenshot for plan upgrades
    paymentScreenshot: { type: String, default: null },


    // UTR Number for payment tracking
    utrNumber: { type: String, unique: true, sparse: true },

    // Service start and expiry dates
    serviceStartDate: { type: Date },
    serviceExpiryDate: { type: Date },
    leadStage: {
      type: String,
      enum: ["Active", "Follow Up", "Inactive", "Onboard"],
      default: "Active",
    },
    leadStatus: {
      type: String,
      enum: ["Hot", "Warm", "Cold", ""],
      default: "",
    },
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    accountManagerName: {
      type: String,
      default: null,
    },

    referCode: { type: String },
    // Franchise and agent referral tracking
    franchiseId: { type: String, default: null },
    referredByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "FranchiseTeam", default: null },
    referredByAgentName: { type: String, default: null },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    /**
     * Lead transfer tag — pehle ye lead kiske paas thi.
     * Bulk reassign (/api/admin/lead-reassign-round-robin) aur manual assign
     * dono isse set karte hain, taaki table me "Prev: <agent>" dikh sake.
     */
    previousAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    previousAgentName: { type: String, default: null },
    agentTransferredAt: { type: Date, default: null },

    // Call Tracking Fields
    callCount: { type: Number, default: 0 },
    callHistory: [
      {
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        agentName: { type: String },
        calledAt: { type: Date, default: Date.now },
        remark: { type: String },
      }
    ],

    remarksHistory: [
      {
        text: String,
        agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        agentName: { type: String },
        calledAt: { type: Date, default: Date.now },
        messageSent: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        followUpDate: { type: Date, default: null },
      }
    ],

    subscription: {
      plan: { type: String },
      paymentId: { type: String },
      orderId: { type: String },
      date: { type: Date },
      expiry: { type: Date },
      status: { type: String, enum: ["active", "inactive"], default: "inactive" },
      maxAccounts: { type: Number, default: 0 },
      accounts: [
        {
          googleId: String,
          email: String,
          listingData: Object,
        },
      ],
    },

    source: {
      type: String,
      enum: [
        "signup",
        "bulk-upload",
        "csv-import",
        "excel-import",
        "checkout",
        "website",
        "chatbot",
        "manual-upload",
        "Meta Lead",
        "Meta Leads",
        "Meta",
        "Real estate leads",
        "expolead",
        "gmb-scraper",
        // Franchise-panel connected lead sources (see FranchiseLeadSource)
        "google-ads",
        "whatsapp",
        "other-platform",
      ],
      default: "signup",
    },

    /** e.g. `metaleads` for bulk / sheet / manual Meta imports */
    leadTags: { type: [String], default: [] },
    metaLeadId: { type: String, default: null, sparse: true },
    metaFormId: { type: String, default: null },
    metaCreatedAt: { type: Date, default: null },
    metaSyncedAt: { type: Date, default: null },

    /** One-time welcome_bonus WhatsApp (AISensy) after registration */
    welcomeBonusWhatsAppSent: { type: Boolean, default: false },

    /** Client's business/brand name, as captured at onboarding. */
    businessName: { type: String, default: "" },

    connectedBusinessEmail: { type: String, default: null },
    selectedBusiness: {
      type: {
        name: String,
        email: String,
        projectId: String,
        googleId: String
      },
      default: null
    },
    gmbProjectId: { type: String, default: null },
    isBusinessConnected: { type: Boolean, default: false },
    isServiceBooked: { type: Boolean, default: false },

    /** Automated webinar onboarding (signup + bulk-upload Meta): IST schedule + WhatsApp + optional email */
    onboardingWebinarSessionAt: { type: Date, default: null },
    onboardingWebinarReminderAt: { type: Date, default: null },
    onboardingWebinarSessionLabel: { type: String, default: "" },
    onboardingWelcomeWhatsAppSent: { type: Boolean, default: false },
    onboardingWebinarInviteWhatsAppSent: { type: Boolean, default: false },
    onboardingWebinarReminderSent: { type: Boolean, default: false },
    onboardingWelcomeEmailSent: { type: Boolean, default: false },

    // Store OTP temporarily for verification
    otp: { type: String },
    otpExpiresAt: { type: Date },

    /** Firebase Cloud Messaging token for push notifications (from app login) */
    fcmToken: { type: String, default: null },

    /* DEPRECATED: automationSettings (migrated to AutomationPlan model 2024)
       Keep for legacy data during transition. Remove after migration complete.
    automationSettings: {
      automationEnabled: { type: Boolean, default: false },
      // Posting frequency for schedule generation
      frequency: {
        type: String,
        enum: ['daily', 'alternate', 'twicedaily', 'weekly', 'custom'],
        default: 'daily',
      },
      // Master keyword pool for this automation plan
      keywords: [{ type: String }],
      // Human-friendly topic label (derived from keywords on the UI side)
      topic: { type: String },
      // Image generation configuration
      imageConfig: {
        colourPalette: { type: String, default: 'none' },
        size: { type: String, default: '3:4' },
        characterImage: { type: String, default: null },
        uniformImage: { type: String, default: null },
        productImage: { type: String, default: null },
        backgroundImage: { type: String, default: null },
        logoImage: { type: String, default: null },
      },
      // Platforms to post to (e.g. ['gmb', 'fb', 'ig'])
      platforms: [{ type: String, enum: ['gmb', 'fb', 'ig'] }],
      // Scheduling configuration
      startDate: { type: Date },
      // Explicit schedule of dates when cron should run for this user
      schedule: [{ type: Date }],
      lastPostDate: { type: Date },
      // Tracks which keyword index to use next; increments after each successful post
      postIndex: { type: Number, default: 0 },
    },
    */

    profileData: {
      name: { type: String },
      description: { type: String },
      categories: [{ name: String }],
      phone: { type: String },
      website: { type: String },
      address: { type: String },
      hours: {
        Monday: { open: Boolean, from: String, to: String },
        Tuesday: { open: Boolean, from: String, to: String },
        Wednesday: { open: Boolean, from: String, to: String },
        Thursday: { open: Boolean, from: String, to: String },
        Friday: { open: Boolean, from: String, to: String },
        Saturday: { open: Boolean, from: String, to: String },
        Sunday: { open: Boolean, from: String, to: String }
      }
    },

    gmbScraperData: {
      address: { type: String, default: "" },
      website: { type: String, default: "" },
      rating: { type: Number, default: null },
      reviews: { type: Number, default: null },
      mapsUrl: { type: String, default: "" },
      placeId: { type: String, default: "", sparse: true },
      city: { type: String, default: "" },
      category: { type: String, default: "" },
    },

    /**
     * Google Places "Generate Report" cache (per-user, 10-day freshness).
     * `place` holds the raw Places searchText result the admin selected.
     */
    businessReport: {
      placeId: { type: String, default: "" },
      businessName: { type: String, default: "" },
      city: { type: String, default: "" },
      place: { type: mongoose.Schema.Types.Mixed, default: null },
      pdfUrl: { type: String, default: "" },
      fetchedAt: { type: Date, default: null },
      generatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
