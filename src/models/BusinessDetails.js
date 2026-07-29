import mongoose from "mongoose";

/**
 * One AI-generated sales analysis of the business profile. Kept as a proper
 * sub-schema (not Mixed) so the sales dashboard can query/sort on scores.
 */
const aiAnalysisSchema = new mongoose.Schema(
  {
    /* ── Headline scoring ──────────────────────────────────────────── */
    overallScore: { type: Number, min: 0, max: 100, default: null },
    leadTemperature: {
      type: String,
      enum: ["Hot", "Warm", "Cold", ""],
      default: "",
    },
    conversionLikelihood: { type: Number, min: 0, max: 100, default: null },
    summary: { type: String, default: "" },

    /* ── Per-area scores (0-100) ───────────────────────────────────── */
    scores: {
      onlinePresence: { type: Number, min: 0, max: 100, default: null },
      reputation: { type: Number, min: 0, max: 100, default: null },
      profileCompleteness: { type: Number, min: 0, max: 100, default: null },
      contentQuality: { type: Number, min: 0, max: 100, default: null },
      competitiveness: { type: Number, min: 0, max: 100, default: null },
    },

    /* ── Business classification ───────────────────────────────────── */
    businessCategory: { type: String, default: "" },
    businessSize: {
      type: String,
      enum: ["Micro", "Small", "Medium", "Large", ""],
      default: "",
    },
    estimatedMonthlyBudget: { type: String, default: "" },

    /* ── Problem → Limbu solution mapping (agent ka main hathiyar) ─── */
    problemSolutions: {
      type: [
        {
          problem: { type: String, default: "" }, // business ki dikkat
          evidence: { type: String, default: "" }, // Google data se proof
          impact: { type: String, default: "" }, // isse business ko kya nuksaan
          limbuFeatures: { type: [String], default: [] }, // catalog ke naam
          howLimbuFixes: { type: String, default: "" }, // Limbu kaise theek karta hai
          salesPitchLine: { type: String, default: "" }, // agent ye line bolega
          priority: {
            type: String,
            enum: ["High", "Medium", "Low", ""],
            default: "",
          },
          _id: false,
        },
      ],
      default: [],
    },

    /* ── What the agent actually pitches ───────────────────────────── */
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    opportunities: { type: [String], default: [] },
    painPoints: { type: [String], default: [] },
    talkingPoints: { type: [String], default: [] },
    objectionHandling: {
      type: [
        {
          objection: { type: String, default: "" },
          response: { type: String, default: "" },
          _id: false,
        },
      ],
      default: [],
    },

    /* ── Recommended services with priority + reasoning ────────────── */
    recommendedServices: {
      type: [
        {
          problem: { type: String, default: "" }, // business ki dikkat
          service: { type: String, default: "" }, // Limbu ka solution
          priority: {
            type: String,
            enum: ["High", "Medium", "Low", ""],
            default: "",
          },
          reason: { type: String, default: "" }, // ye service kaise fix karegi
          _id: false,
        },
      ],
      default: [],
    },

    /* ── Outreach helpers ──────────────────────────────────────────── */
    pitchAngle: { type: String, default: "" },
    suggestedOpeningLine: { type: String, default: "" },
    suggestedWhatsAppMessage: { type: String, default: "" },
    nextBestAction: { type: String, default: "" },

    /* ── Provenance ────────────────────────────────────────────────── */
    model: { type: String, default: "" },
    promptVersion: { type: String, default: "" },
    tokensUsed: { type: Number, default: null },
    generatedBy: { type: String, default: "" }, // admin email that triggered it
    raw: { type: mongoose.Schema.Types.Mixed, default: null }, // full model JSON
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * BusinessDetails — Google Places data for a lead, stored separately from User
 * so the sales team / AI can run analysis on the full business profile.
 *
 * User identity (userId, phone, fullName, email) is denormalised here on every
 * save so an analysis query never needs a join back to the users collection.
 */
const businessDetailsSchema = new mongoose.Schema(
  {
    /* ── Link back to the lead ─────────────────────────────────────── */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userId: { type: String, required: true, index: true },
    phone: { type: String, default: "", index: true },
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },

    /* ── What the admin searched for ───────────────────────────────── */
    searchedBusinessName: { type: String, default: "" },
    searchedCity: { type: String, default: "" },

    /* ── Google Places identity ────────────────────────────────────── */
    placeId: { type: String, default: "", index: true },
    name: { type: String, default: "" }, // Places resource name (places/xxx)
    displayName: { type: String, default: "" },
    displayNameLanguage: { type: String, default: "" },
    businessStatus: { type: String, default: "" },
    primaryType: { type: String, default: "" },
    primaryTypeDisplayName: { type: String, default: "" },
    types: { type: [String], default: [] },

    /* ── Contact ───────────────────────────────────────────────────── */
    nationalPhoneNumber: { type: String, default: "" },
    internationalPhoneNumber: { type: String, default: "" },
    websiteUri: { type: String, default: "" },
    googleMapsUri: { type: String, default: "" },

    /* ── Address / geo ─────────────────────────────────────────────── */
    formattedAddress: { type: String, default: "" },
    shortFormattedAddress: { type: String, default: "" },
    addressComponents: { type: [mongoose.Schema.Types.Mixed], default: [] },
    plusCode: { type: mongoose.Schema.Types.Mixed, default: null },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    viewport: { type: mongoose.Schema.Types.Mixed, default: null },
    utcOffsetMinutes: { type: Number, default: null },
    adrFormatAddress: { type: String, default: "" },

    /* ── Reputation ────────────────────────────────────────────────── */
    rating: { type: Number, default: null },
    userRatingCount: { type: Number, default: null },
    reviews: { type: [mongoose.Schema.Types.Mixed], default: [] },
    editorialSummary: { type: String, default: "" },

    /* ── Hours ─────────────────────────────────────────────────────── */
    regularOpeningHours: { type: mongoose.Schema.Types.Mixed, default: null },
    currentOpeningHours: { type: mongoose.Schema.Types.Mixed, default: null },
    openNow: { type: Boolean, default: null },
    weekdayDescriptions: { type: [String], default: [] },

    /* ── Media ─────────────────────────────────────────────────────── */
    photos: { type: [mongoose.Schema.Types.Mixed], default: [] },
    photoCount: { type: Number, default: 0 },
    iconMaskBaseUri: { type: String, default: "" },
    iconBackgroundColor: { type: String, default: "" },

    /* ── Commerce / attributes (useful sales signals) ──────────────── */
    priceLevel: { type: String, default: "" },
    priceRange: { type: mongoose.Schema.Types.Mixed, default: null },
    takeout: { type: Boolean, default: null },
    delivery: { type: Boolean, default: null },
    dineIn: { type: Boolean, default: null },
    curbsidePickup: { type: Boolean, default: null },
    reservable: { type: Boolean, default: null },
    servesBreakfast: { type: Boolean, default: null },
    servesLunch: { type: Boolean, default: null },
    servesDinner: { type: Boolean, default: null },
    servesBeer: { type: Boolean, default: null },
    servesWine: { type: Boolean, default: null },
    servesVegetarianFood: { type: Boolean, default: null },
    outdoorSeating: { type: Boolean, default: null },
    liveMusic: { type: Boolean, default: null },
    goodForChildren: { type: Boolean, default: null },
    goodForGroups: { type: Boolean, default: null },
    allowsDogs: { type: Boolean, default: null },
    restroom: { type: Boolean, default: null },
    parkingOptions: { type: mongoose.Schema.Types.Mixed, default: null },
    paymentOptions: { type: mongoose.Schema.Types.Mixed, default: null },
    accessibilityOptions: { type: mongoose.Schema.Types.Mixed, default: null },
    fuelOptions: { type: mongoose.Schema.Types.Mixed, default: null },
    evChargeOptions: { type: mongoose.Schema.Types.Mixed, default: null },

    /* ── Derived signals for the sales agent / AI ──────────────────── */
    signals: {
      hasWebsite: { type: Boolean, default: false },
      hasPhone: { type: Boolean, default: false },
      hasPhotos: { type: Boolean, default: false },
      hasReviews: { type: Boolean, default: false },
      hasOpeningHours: { type: Boolean, default: false },
      isOperational: { type: Boolean, default: false },
      lowRating: { type: Boolean, default: false }, // rating < 4
      lowReviewCount: { type: Boolean, default: false }, // < 25 reviews
      profileCompleteness: { type: Number, default: 0 }, // 0-100
    },

    /* ── Report / raw payload ──────────────────────────────────────── */
    pdfUrl: { type: String, default: "" },
    rawPlace: { type: mongoose.Schema.Types.Mixed, default: null },

    /* ── AI analysis output ────────────────────────────────────────── */
    aiAnalysis: { type: aiAnalysisSchema, default: null }, // latest run
    aiAnalysisHistory: { type: [aiAnalysisSchema], default: [] }, // previous runs
    aiAnalysedAt: { type: Date, default: null },
    aiAnalysisStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    aiAnalysisError: { type: String, default: "" },

    /* ── Bookkeeping ───────────────────────────────────────────────── */
    source: { type: String, default: "google-places" },
    fetchedAt: { type: Date, default: null },
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One business record per user+place; a user re-searching the same place updates it.
businessDetailsSchema.index({ userId: 1, placeId: 1 }, { unique: true });

// Sales dashboard sorting — best leads first.
businessDetailsSchema.index({ "aiAnalysis.overallScore": -1 });
businessDetailsSchema.index({ "aiAnalysis.leadTemperature": 1, aiAnalysedAt: -1 });

/**
 * Persists an AI analysis result: the previous run (if any) is pushed to
 * history, the new one becomes `aiAnalysis`, and status/timestamps are stamped.
 */
businessDetailsSchema.statics.saveAiAnalysis = async function (
  { userId, placeId },
  analysis,
) {
  const doc = await this.findOne({ userId, placeId });
  if (!doc) return null;

  if (doc.aiAnalysis) {
    doc.aiAnalysisHistory.push(doc.aiAnalysis);
    // Keep the last 10 runs only — enough to show a trend, bounded in size.
    if (doc.aiAnalysisHistory.length > 10) {
      doc.aiAnalysisHistory = doc.aiAnalysisHistory.slice(-10);
    }
  }

  doc.aiAnalysis = { ...analysis, generatedAt: new Date() };
  doc.aiAnalysedAt = new Date();
  doc.aiAnalysisStatus = "completed";
  doc.aiAnalysisError = "";

  await doc.save();
  return doc;
};

/**
 * Flattens a Google Places v1 `place` object into this schema's shape and
 * merges the owning user's identity fields.
 */
export function buildBusinessDetailsDoc({ user, place, businessName, city, pdfUrl }) {
  const p = place || {};
  const text = (v) => (typeof v === "string" ? v : v?.text || "");

  const photos = Array.isArray(p.photos) ? p.photos : [];
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const rating = typeof p.rating === "number" ? p.rating : null;
  const userRatingCount =
    typeof p.userRatingCount === "number" ? p.userRatingCount : null;

  const hasWebsite = Boolean(p.websiteUri);
  const hasPhone = Boolean(p.nationalPhoneNumber || p.internationalPhoneNumber);
  const hasPhotos = photos.length > 0;
  const hasReviews = (userRatingCount || 0) > 0 || reviews.length > 0;
  const hasOpeningHours = Boolean(p.regularOpeningHours || p.currentOpeningHours);

  const completenessChecks = [
    hasWebsite,
    hasPhone,
    hasPhotos,
    hasReviews,
    hasOpeningHours,
    Boolean(p.formattedAddress),
    Boolean(text(p.editorialSummary)),
    Boolean(p.primaryType),
  ];
  const profileCompleteness = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  const now = new Date();

  return {
    user: user?._id || null,
    userId: user?.userId || "",
    phone: user?.phone || "",
    fullName: user?.fullName || "",
    email: user?.email || "",

    searchedBusinessName: businessName || "",
    searchedCity: city || "",

    placeId: p.id || p.placeId || "",
    name: p.name || "",
    displayName: text(p.displayName),
    displayNameLanguage: p.displayName?.languageCode || "",
    businessStatus: p.businessStatus || "",
    primaryType: p.primaryType || "",
    primaryTypeDisplayName: text(p.primaryTypeDisplayName),
    types: Array.isArray(p.types) ? p.types : [],

    nationalPhoneNumber: p.nationalPhoneNumber || "",
    internationalPhoneNumber: p.internationalPhoneNumber || "",
    websiteUri: p.websiteUri || "",
    googleMapsUri: p.googleMapsUri || "",

    formattedAddress: p.formattedAddress || "",
    shortFormattedAddress: p.shortFormattedAddress || "",
    addressComponents: Array.isArray(p.addressComponents)
      ? p.addressComponents
      : [],
    plusCode: p.plusCode || null,
    location: {
      latitude: p.location?.latitude ?? null,
      longitude: p.location?.longitude ?? null,
    },
    viewport: p.viewport || null,
    utcOffsetMinutes:
      typeof p.utcOffsetMinutes === "number" ? p.utcOffsetMinutes : null,
    adrFormatAddress: p.adrFormatAddress || "",

    rating,
    userRatingCount,
    reviews,
    editorialSummary: text(p.editorialSummary),

    regularOpeningHours: p.regularOpeningHours || null,
    currentOpeningHours: p.currentOpeningHours || null,
    openNow:
      p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow ?? null,
    weekdayDescriptions:
      p.regularOpeningHours?.weekdayDescriptions ||
      p.currentOpeningHours?.weekdayDescriptions ||
      [],

    photos,
    photoCount: photos.length,
    iconMaskBaseUri: p.iconMaskBaseUri || "",
    iconBackgroundColor: p.iconBackgroundColor || "",

    priceLevel: p.priceLevel || "",
    priceRange: p.priceRange || null,
    takeout: p.takeout ?? null,
    delivery: p.delivery ?? null,
    dineIn: p.dineIn ?? null,
    curbsidePickup: p.curbsidePickup ?? null,
    reservable: p.reservable ?? null,
    servesBreakfast: p.servesBreakfast ?? null,
    servesLunch: p.servesLunch ?? null,
    servesDinner: p.servesDinner ?? null,
    servesBeer: p.servesBeer ?? null,
    servesWine: p.servesWine ?? null,
    servesVegetarianFood: p.servesVegetarianFood ?? null,
    outdoorSeating: p.outdoorSeating ?? null,
    liveMusic: p.liveMusic ?? null,
    goodForChildren: p.goodForChildren ?? null,
    goodForGroups: p.goodForGroups ?? null,
    allowsDogs: p.allowsDogs ?? null,
    restroom: p.restroom ?? null,
    parkingOptions: p.parkingOptions || null,
    paymentOptions: p.paymentOptions || null,
    accessibilityOptions: p.accessibilityOptions || null,
    fuelOptions: p.fuelOptions || null,
    evChargeOptions: p.evChargeOptions || null,

    signals: {
      hasWebsite,
      hasPhone,
      hasPhotos,
      hasReviews,
      hasOpeningHours,
      isOperational: p.businessStatus === "OPERATIONAL",
      lowRating: rating != null && rating < 4,
      lowReviewCount: (userRatingCount || 0) < 25,
      profileCompleteness,
    },

    pdfUrl: pdfUrl || "",
    rawPlace: p,

    source: "google-places",
    fetchedAt: now,
    generatedAt: now,
  };
}

export default mongoose.models.BusinessDetails ||
  mongoose.model("BusinessDetails", businessDetailsSchema);
