import mongoose from "mongoose";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

/**
 * One document per chatbot session_id.
 * Replaces the AdminBusiness‑based approach for the connect-google-business flow.
 */
const GMBConnectionSchema = new mongoose.Schema({
  sessionId:    { type: String, required: true, unique: true },
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
 * Upsert a GMBConnection document for `sessionId`.
 * @param {string}    sessionId
 * @param {string}    userEmail
 * @param {unknown[]} rawListings  - raw GMB API listing objects
 */
export async function saveGmbSession(sessionId, userEmail, rawListings) {
  if (!sessionId) throw new Error("sessionId is required");

  const GMBConnection = await getGMBConnectionModel();
  const listings = Array.isArray(rawListings) ? rawListings : [];
  const locationsData = buildLocationsData(listings);
  const connected = locationsData.length > 0;

  return GMBConnection.findOneAndUpdate(
    { sessionId },
    {
      sessionId,
      userEmail: (userEmail || "").toLowerCase(),
      status:    connected ? "success" : "not_found",
      message:   connected
        ? "Business connected successfully"
        : "No business locations found for this account",
      locationsData,
      updatedAt: new Date(),
    },
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
 * Shape a DB row (or null) into the exact chatbot API response.
 */
export function formatGmbSessionResponse(row) {
  if (!row) {
    return {
      status: "not_found",
      
      message:
        "Session not found. Open the connect-google-business link from chat, sign in with Google, and tap Continue to chatbot.",
      locationsData: [],
    };
  }
  return {
    status:        row.status === "success" ? "success" : "not_found",
    email:         row.userEmail || "",
    message:       row.message || "",
    locationsData: Array.isArray(row.locationsData) ? row.locationsData : [],
  };
}
