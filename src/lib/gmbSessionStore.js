/**
 * gmbSessionStore.js
 *
 * Phone number is the SOLE external identifier.
 * session_id is an internal MongoDB key derived from phone ("phone_<digits>").
 * accessToken + refreshToken are saved at the moment the user clicks
 * "Continue to chatbot" — no separate GmbUser lookup needed for actions.
 */

import mongoose from "mongoose";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const GMBConnectionSchema = new mongoose.Schema({
  /** Internal MongoDB unique key — always "phone_<digits>" */
  sessionId: { type: String, required: true, unique: true },

  /** WhatsApp / mobile number — the primary external identifier */
  phone: { type: String, required: true, unique: true },

  status:  { type: String, enum: ["success", "not_found", "pending"], default: "pending" },
  message: { type: String, default: "" },

  locationsData: {
    type: [
      {
        title:                String,
        verified:             { type: Boolean, default: false },
        locality:             { type: String, default: "" },  // storefrontAddress.locality (city name)
        addressLine:          { type: String, default: "" },  // street lines only (no city/region/postal)
        address:              String,                         // full formatted address
        locationResourceName: String,
        websiteUri:           String,
        accountId:            String,
        primaryPhone:         String,
        categories:           [String],
        /** For building the public /reviews/<slug> Google-review redirect link */
        placeId:              { type: String, default: "" },
        newReviewUri:         { type: String, default: "" },
      },
    ],
    default: [],
  },

  userEmail: { type: String, default: "" },

  /** Google OAuth tokens — saved when user clicks "Continue to chatbot" */
  accessToken:  { type: String, default: "" },
  refreshToken: { type: String, default: "" },
  tokenSavedAt: { type: Date,   default: null },

  /** Razorpay / checkout */
  paymentStatus:    { type: String, enum: ["none", "paid"], default: "none" },
  paymentId:        { type: String, default: "" },
  paymentOrderId:   { type: String, default: "" },
  paymentAmount:    { type: String, default: "" },
  paymentPlanTitle: { type: String, default: "" },
  paymentUserId:    { type: String, default: "" },
  paymentEmail:     { type: String, default: "" },
  paidAt:           { type: Date,   default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── Connection (dedicated pool) ───────────────────────────────────────────────

let gmbConn = null;

async function getGmbConnection() {
  if (gmbConn && gmbConn.readyState === 1) return gmbConn;
  const uri = getRequiredEnv("MONGODB_URI");
  gmbConn = mongoose.createConnection(uri);
  await gmbConn.asPromise();
  return gmbConn;
}

async function getGMBConnectionModel() {
  const conn = await getGmbConnection();
  return (
    conn.models.GMBConnection ||
    conn.model("GMBConnection", GMBConnectionSchema)
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabels(categories) {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => (c && (c.displayName || c.name || c.categoryId)) || "")
    .filter(Boolean);
}

function buildAddressLine(loc) {
  const lines    = (loc?.storefrontAddress?.addressLines || []).filter(Boolean);
  const locality = loc?.storefrontAddress?.locality || "";
  const region   = loc?.storefrontAddress?.administrativeArea || "";
  const postal   = loc?.storefrontAddress?.postalCode || "";
  const tail     = [locality, region, postal].filter(Boolean).join(", ");
  return [...lines, tail].filter(Boolean).join(", ") || "";
}

export function buildLocationsData(listings) {
  return (Array.isArray(listings) ? listings : []).map((l) => {
    const addressLines = (l?.storefrontAddress?.addressLines || []).filter(Boolean);
    return {
      title:                (l?.title && String(l.title).trim()) || "Business",
      verified:             l?.hasVoiceOfMerchant === true,
      locality:             l?.storefrontAddress?.locality || "",
      addressLine:          addressLines.join(", "),
      address:              buildAddressLine(l),
      locationResourceName: typeof l?.name === "string" ? l.name : "",
      websiteUri:           l?.websiteUri || "",
      accountId:            l?.accountId || "",
      primaryPhone:         l?.phoneNumbers?.primaryPhone || "",
      categories:           categoryLabels(l?.categories),
      placeId:              l?.metadata?.placeId || "",
      newReviewUri:         l?.metadata?.newReviewUri || "",
    };
  });
}

// ── Public utilities ──────────────────────────────────────────────────────────

/** Strip all non-digit characters. "919876543210" or "+91 98765 43210" → "919876543210" */
export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/** Ensure locationId has the "locations/" prefix required by the GMB API. */
export function toFullLocationId(locationId) {
  if (!locationId) return "";
  return locationId.startsWith("locations/") ? locationId : `locations/${locationId}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Save (upsert) a GMBConnection keyed by phone.
 * Call this when the user clicks "Continue to chatbot" — tokens are saved here.
 *
 * @param {string}    phone        - raw phone from URL (will be normalised)
 * @param {string}    userEmail    - Google account email
 * @param {unknown[]} rawListings  - raw GMB API listing objects
 * @param {string}    accessToken  - Google OAuth access token (from Next.js session)
 * @param {string}    refreshToken - Google OAuth refresh token (from Next.js session)
 */
export async function saveGmbSessionByPhone(
  phone,
  userEmail,
  rawListings,
  accessToken = "",
  refreshToken = ""
) {
  const digits = normalizePhone(phone);
  if (!digits) throw new Error("phone is required");

  const GMBConnection  = await getGMBConnectionModel();
  const listings       = Array.isArray(rawListings) ? rawListings : [];
  const locationsData  = buildLocationsData(listings);
  const connected      = locationsData.length > 0;
  const now            = new Date();

  const updateFields = {
    phone:    digits,
    sessionId: `phone_${digits}`,          // internal, derived
    userEmail: (userEmail || "").toLowerCase(),
    status:   connected ? "success" : "not_found",
    message:  connected
      ? "Business connected successfully"
      : "No business locations found for this account",
    locationsData,
    updatedAt: now,
  };

  if (accessToken)  { updateFields.accessToken  = accessToken;  updateFields.tokenSavedAt = now; }
  if (refreshToken) { updateFields.refreshToken = refreshToken; }

  return GMBConnection.findOneAndUpdate(
    { phone: digits },
    updateFields,
    { upsert: true, new: true }
  );
}

/**
 * Fetch a GMBConnection by phone number.
 * Returns null if not found.
 */
export async function findGmbSessionByPhone(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const GMBConnection = await getGMBConnectionModel();
  return GMBConnection.findOne({ phone: digits }).lean();
}

/**
 * All chatbot-connected locations, flattened for slug lookup — used by
 * GET /api/review-page/[slug] as a fallback when a business isn't in the
 * dashboard's AdminBusiness collection (e.g. connected only via chatbot).
 *
 * @returns {Promise<Array<{ phone: string, location: object }>>}
 */
export async function findAllSuccessfulGmbLocations() {
  const GMBConnection = await getGMBConnectionModel();
  const docs = await GMBConnection.find(
    { status: "success", "locationsData.0": { $exists: true } },
    { phone: 1, locationsData: 1 }
  ).lean();

  const flattened = [];
  for (const doc of docs) {
    for (const location of doc.locationsData || []) {
      flattened.push({ phone: doc.phone, location });
    }
  }
  return flattened;
}

/**
 * Get only the tokens for an action handler.
 * Returns null if not found or tokens not yet saved.
 *
 * @param {string} phone
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>}
 */
export async function getTokensByPhone(phone) {
  const doc = await findGmbSessionByPhone(phone);
  if (!doc) return null;
  if (!doc.accessToken && !doc.refreshToken) return null;
  return { accessToken: doc.accessToken || "", refreshToken: doc.refreshToken || "" };
}

/**
 * Save refreshed tokens back to the document (called after token refresh).
 */
export async function updateTokensByPhone(phone, accessToken, refreshToken) {
  const digits = normalizePhone(phone);
  if (!digits) return;
  const GMBConnection = await getGMBConnectionModel();
  await GMBConnection.updateOne(
    { phone: digits },
    { $set: { accessToken, refreshToken, tokenSavedAt: new Date(), updatedAt: new Date() } }
  );
}

// ── Payment helper ────────────────────────────────────────────────────────────

/**
 * Attach Razorpay payment details to a GMBConnection by phone.
 */
export async function savePaymentByPhone(phone, payload) {
  const digits = normalizePhone(phone);
  if (!digits) throw new Error("phone is required");
  const GMBConnection = await getGMBConnectionModel();
  const now = new Date();

  return GMBConnection.findOneAndUpdate(
    { phone: digits },
    {
      $set: {
        paymentStatus:    "paid",
        paymentId:        String(payload.paymentId   || ""),
        paymentOrderId:   String(payload.orderId     || ""),
        paymentAmount:    String(payload.totalAmount ?? ""),
        paymentPlanTitle: String(payload.planTitle   || ""),
        paymentUserId:    String(payload.userId      || ""),
        paymentEmail:     String(payload.email       || "").toLowerCase(),
        paidAt:    now,
        updatedAt: now,
      },
      $setOnInsert: {
        sessionId: `phone_${digits}`,
        status: "pending",
        message: "",
        locationsData: [],
        userEmail: "",
        createdAt: now,
      },
    },
    { upsert: true, new: true }
  );
}

// ── Response formatter ────────────────────────────────────────────────────────

export function formatGmbSessionResponse(row) {
  if (!row) {
    return {
      status:           "not_found",
      businessConnected: false,
      paymentStatus:    "none",
      payment:          null,
      phone:            "",
      email:            "",
      message:
        "Business not connected. Open the connect-google-business link from chat and sign in with Google.",
      locationsData: [],
    };
  }

  const locationsData  = Array.isArray(row.locationsData) ? row.locationsData : [];
  const gmbOk          = row.status === "success" && locationsData.length > 0;
  const paid           = row.paymentStatus === "paid" || (!!row.paymentId && !!row.paidAt);
  const paymentStatus  = paid ? "paid" : "none";

  return {
    status:            row.status === "success" ? "success" : "not_found",
    businessConnected: gmbOk,
    paymentStatus,
    payment: paymentStatus === "paid"
      ? {
          paymentId: row.paymentId        || "",
          orderId:   row.paymentOrderId   || "",
          amount:    row.paymentAmount    || "",
          planTitle: row.paymentPlanTitle || "",
          userId:    row.paymentUserId    || "",
          email:     row.paymentEmail     || "",
          paidAt:    row.paidAt ? row.paidAt.toISOString() : null,
        }
      : null,
    phone:         row.phone     || "",
    email:         row.userEmail || "",
    tokensReady:   !!(row.accessToken && row.refreshToken),
    message:       row.message   || "",
    locationsData,
  };
}

// ── Legacy shims (backward compat — do NOT use in new code) ──────────────────

/** @deprecated Use saveGmbSessionByPhone() */
export async function saveGmbSession(sessionId, userEmail, rawListings, phone) {
  const digits = normalizePhone(phone) || normalizePhone(sessionId?.replace("phone_", ""));
  return saveGmbSessionByPhone(digits, userEmail, rawListings, "", "");
}

/** @deprecated Use findGmbSessionByPhone() */
export async function findGmbSession(sessionId) {
  if (!sessionId) return null;
  const phone = sessionId.startsWith("phone_")
    ? sessionId.replace("phone_", "")
    : sessionId;
  return findGmbSessionByPhone(phone);
}

/** @deprecated Use savePaymentByPhone() */
export async function saveGmbSessionPayment(sessionId, payload) {
  const phone = sessionId?.startsWith("phone_")
    ? sessionId.replace("phone_", "")
    : sessionId;
  return savePaymentByPhone(phone, payload);
}
