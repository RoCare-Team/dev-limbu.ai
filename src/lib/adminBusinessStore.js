import mongoose from "mongoose";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

const AdminBusinessSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  listings: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

/** Maps Limbu chat `user_id` (localStorage) → last GMB connect snapshot (chatbot APIs read this) */
const LimbuChatBusinessLinkSchema = new mongoose.Schema({
  userChatId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  connected: { type: Boolean, default: false },
  listingsCount: { type: Number, default: 0 },
  /** Display-ready rows for chatbot / UI */
  businesses: {
    type: [
      {
        title: String,
        verified: { type: Boolean, default: false },
        address: String,
        locationResourceName: String,
        websiteUri: String,
        accountId: String,
      },
    ],
    default: [],
  },
  /** One line the chatbot can show as-is */
  displayMessage: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

/** Dedicated connection */
let dashboardConn = null;

async function getDashboardConnection() {
  if (dashboardConn && dashboardConn.readyState === 1) {
    return dashboardConn;
  }

  const mongoUri = getRequiredEnv("MONGODB_URI");

  dashboardConn = mongoose.createConnection(mongoUri);

  await dashboardConn.asPromise();
  return dashboardConn;
}

export async function getAdminBusinessModel() {
  const conn = await getDashboardConnection();
  return (
    conn.models.AdminBusiness ||
    conn.model("AdminBusiness", AdminBusinessSchema)
  );
}

async function getLimbuChatBusinessLinkModel() {
  const conn = await getDashboardConnection();
  return (
    conn.models.LimbuChatBusinessLink ||
    conn.model("LimbuChatBusinessLink", LimbuChatBusinessLinkSchema)
  );
}

function formatListingAddressLine(loc) {
  const lines = (loc?.storefrontAddress?.addressLines || []).filter(Boolean);
  const locality = loc?.storefrontAddress?.locality || "";
  const region = loc?.storefrontAddress?.administrativeArea || "";
  const postal = loc?.storefrontAddress?.postalCode || "";
  const tail = [locality, region, postal].filter(Boolean).join(", ");
  const parts = [...lines, tail].filter(Boolean);
  return parts.join(", ") || "";
}

export function buildBusinessRowsFromGmbListings(listings) {
  const listingsArr = Array.isArray(listings) ? listings : [];
  return listingsArr.map((l) => ({
    title: (l.title && String(l.title).trim()) || "Business",
    verified: l.hasVoiceOfMerchant === true,
    address: formatListingAddressLine(l),
    locationResourceName: typeof l.name === "string" ? l.name : "",
    websiteUri: l.websiteUri || "",
    accountId: l.accountId || "",
  }));
}

export function buildDisplayMessageForConnect(businesses, connected) {
  if (!connected || !businesses?.length) {
    return "Google Business abhi connect nahi hua ya is account par koi Business Profile location save nahi mili.";
  }
  const names = businesses.map((b) => b.title).join(", ");
  const n = businesses.length;
  return `Successfully connected: ${names} (${n} location${n === 1 ? "" : "s"}).`;
}

/**
 * @param {string} userChatId - same as `limbu_ai_chat_user_id` in localStorage
 * @param {string} userEmail
 * @param {unknown[]} listings - raw GMB listing objects or []
 */
export async function upsertLimbuChatBusinessLink(userChatId, userEmail, listings) {
  if (!userChatId || !userEmail) return null;
  const listingsArr = Array.isArray(listings) ? listings : [];
  const connected = listingsArr.length > 0;
  const businesses = buildBusinessRowsFromGmbListings(listingsArr);
  const displayMessage = buildDisplayMessageForConnect(businesses, connected);
  const LimbuChatLink = await getLimbuChatBusinessLinkModel();
  return LimbuChatLink.findOneAndUpdate(
    { userChatId },
    {
      userChatId,
      userEmail: userEmail.toLowerCase(),
      connected,
      listingsCount: listingsArr.length,
      businesses,
      displayMessage,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

export async function findLimbuChatBusinessLinkByUserChatId(userChatId) {
  if (!userChatId) return null;
  const LimbuChatLink = await getLimbuChatBusinessLinkModel();
  return LimbuChatLink.findOne({ userChatId }).lean();
}

/**
 * Persist GMB listings for a user (same behavior as POST /api/admin/saveBussiness).
 * Use this from server code instead of HTTP-fetching your own API (avoids "fetch failed").
 */
export async function saveUserBusinessListings(userEmail, listings) {
  if (!userEmail) {
    throw new Error("userEmail is required");
  }
  if (!Array.isArray(listings)) {
    throw new Error("Listings must be an array");
  }

  const AdminBusiness = await getAdminBusinessModel();
  const updatedBusiness = await AdminBusiness.findOneAndUpdate(
    { userEmail: userEmail.toLowerCase() },
    {
      userEmail: userEmail.toLowerCase(),
      listings,
      timestamp: new Date(),
    },
    { upsert: true, new: true }
  );

  return { listings: updatedBusiness.listings };
}
