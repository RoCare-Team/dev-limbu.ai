import mongoose from "mongoose";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

/**
 * One document per chatbot session_id (or phone-derived session).
 * Replaces the AdminBusiness‑based approach for the connect-google-business flow.
 *
 * phone-based flow:
 *   sessionId = "phone_<digits>"  when chatbot uses phone as primary key
 *   phone     = "919876543210"    stored for direct phone lookups
 */
const GMBConnectionSchema = new mongoose.Schema({
  sessionId:    { type: String, required: true, unique: true },
  /** Chatbot user's WhatsApp / mobile number (E.164 digits, e.g. 919876543210) */
  phone:        { type: String, default: "", index: true },
  status:       { type: String, enum: ["success", "not_found", "pending"], default: "pending" },
  message:      { type: String, default: "" },
  locationsData: {
    type: [
      {
        title:                String,
        verified:             { type: Boolean, default: false },
        address:              String,
        locationResourceName: String,
        websiteUri:           String,
        accountId:            String,
        primaryPhone:         String,
        categories:           [String],
      },
    ],
    default: [],
  },
  userEmail: { type: String, default: "" },
  /** Razorpay / checkout — same session_id as chatbot GMB flow */
  paymentStatus: {
    type: String,
    enum: ["none", "paid"],
    default: "none",
  },
  paymentId: { type: String, default: "" },
  paymentOrderId: { type: String, default: "" },
  paymentAmount: { type: String, default: "" },
  paymentPlanTitle: { type: String, default: "" },
  paymentUserId: { type: String, default: "" },
  paymentEmail: { type: String, default: "" },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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

/* ─── Internal helpers ─────────────────────────────────────────────── */

function categoryLabels(categories) {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => (c && (c.displayName || c.name || c.categoryId)) || "")
    .filter(Boolean);
}

function buildAddressLine(loc) {
  const lines = (loc?.storefrontAddress?.addressLines || []).filter(Boolean);
  const locality = loc?.storefrontAddress?.locality || "";
  const region   = loc?.storefrontAddress?.administrativeArea || "";
  const postal   = loc?.storefrontAddress?.postalCode || "";
  const tail = [locality, region, postal].filter(Boolean).join(", ");
  return [...lines, tail].filter(Boolean).join(", ") || "";
}

/**
 * Convert raw GMB API listing objects into the standard `locationsData` rows.
 */
export function buildLocationsData(listings) {
  const arr = Array.isArray(listings) ? listings : [];
  return arr.map((l) => ({
    title:                (l?.title && String(l.title).trim()) || "Business",
    verified:             l?.hasVoiceOfMerchant === true,
    address:              buildAddressLine(l),
    locationResourceName: typeof l?.name === "string" ? l.name : "",
    websiteUri:           l?.websiteUri || "",
    accountId:            l?.accountId || "",
    primaryPhone:         l?.phoneNumbers?.primaryPhone || "",
    categories:           categoryLabels(l?.categories),
  }));
}

/* ─── Public API ───────────────────────────────────────────────────── */

/**
 * Normalise a phone string: keep digits only.
 * "919876543210" → "919876543210"
 * "+91 98765 43210" → "919876543210"
 */
export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * Ensure locationId has the "locations/" prefix used by the GMB API.
 */
export function toFullLocationId(locationId) {
  if (!locationId) return "";
  return locationId.startsWith("locations/") ? locationId : `locations/${locationId}`;
}

/**
 * Derive a deterministic sessionId from a phone number.
 * Used when the chatbot identifies users by phone instead of a UUID.
 */
export function sessionIdFromPhone(phone) {
  const digits = normalizePhone(phone);
  if (!digits) throw new Error("phone is required to derive sessionId");
  return `phone_${digits}`;
}

/**
 * Upsert a GMBConnection document for `sessionId`.
 * @param {string}    sessionId
 * @param {string}    userEmail
 * @param {unknown[]} rawListings  - raw GMB API listing objects
 * @param {string}    [phone]      - optional WhatsApp/mobile number (digits)
 */
export async function saveGmbSession(sessionId, userEmail, rawListings, phone) {
  if (!sessionId) throw new Error("sessionId is required");

  const GMBConnection = await getGMBConnectionModel();
  const listings = Array.isArray(rawListings) ? rawListings : [];
  const locationsData = buildLocationsData(listings);
  const connected = locationsData.length > 0;

  const updateFields = {
    sessionId,
    userEmail: (userEmail || "").toLowerCase(),
    status:    connected ? "success" : "not_found",
    message:   connected
      ? "Business connected successfully"
      : "No business locations found for this account",
    locationsData,
    updatedAt: new Date(),
  };

  const digits = normalizePhone(phone);
  if (digits) updateFields.phone = digits;

  return GMBConnection.findOneAndUpdate(
    { sessionId },
    updateFields,
    { upsert: true, new: true }
  );
}

/**
 * Fetch a GMBConnection by sessionId. Returns null if not found.
 */
export async function findGmbSession(sessionId) {
  if (!sessionId) return null;
  const GMBConnection = await getGMBConnectionModel();
  return GMBConnection.findOne({ sessionId }).lean();
}

/**
 * Fetch a GMBConnection by phone number (digits only, e.g. "919876543210").
 * Returns null if not found.
 */
export async function findGmbSessionByPhone(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const GMBConnection = await getGMBConnectionModel();
  // Try by phone field first, then by phone-derived sessionId (backward compat)
  const byPhone = await GMBConnection.findOne({ phone: digits }).lean();
  if (byPhone) return byPhone;
  return GMBConnection.findOne({ sessionId: `phone_${digits}` }).lean();
}

/**
 * After successful checkout: attach payment to the same chatbot session document.
 * Upserts a minimal row if GMB sync has not run yet.
 */
export async function saveGmbSessionPayment(sessionId, payload) {
  if (!sessionId) throw new Error("sessionId is required");
  const GMBConnection = await getGMBConnectionModel();
  const now = new Date();
  const emailNorm = String(payload.email || "")
    .trim()
    .toLowerCase();

  return GMBConnection.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        paymentStatus: "paid",
        paymentId: String(payload.paymentId || ""),
        paymentOrderId: String(payload.orderId || ""),
        paymentAmount: String(payload.totalAmount ?? ""),
        paymentPlanTitle: String(payload.planTitle || ""),
        paymentUserId: String(payload.userId || ""),
        paymentEmail: emailNorm,
        paidAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        sessionId,
        status: "pending",
        message: "",
        locationsData: [],
        userEmail: "",
        createdAt: now,
      },
    },
    { upsert: true, new: true },
  );
}

/**
 * Shape a DB row (or null) into the exact chatbot API response.
 */
export function formatGmbSessionResponse(row) {
  if (!row) {
    return {
      status: "not_found",
      businessConnected: false,
      paymentStatus: "none",
      payment: null,
      message:
        "Session not found. Open the connect-google-business link from chat, sign in with Google, and tap Continue to chatbot.",
      locationsData: [],
    };
  }
  const locationsData = Array.isArray(row.locationsData) ? row.locationsData : [];
  const gmbOk = row.status === "success" && locationsData.length > 0;
  const paid =
    row.paymentStatus === "paid" ||
    (!!row.paymentId && !!row.paidAt);
  const paymentStatus = paid ? "paid" : "none";

  return {
    status: row.status === "success" ? "success" : "not_found",
    businessConnected: gmbOk,
    paymentStatus,
    payment:
      paymentStatus === "paid"
        ? {
            paymentId: row.paymentId || "",
            orderId: row.paymentOrderId || "",
            amount: row.paymentAmount || "",
            planTitle: row.paymentPlanTitle || "",
            userId: row.paymentUserId || "",
            email: row.paymentEmail || "",
            paidAt: row.paidAt ? row.paidAt.toISOString() : null,
          }
        : null,
    email: row.userEmail || "",
    message: row.message || "",
    locationsData,
  };
}
