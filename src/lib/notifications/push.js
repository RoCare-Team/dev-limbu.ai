/**
 * Push notifications to the Limbu app through Firebase Cloud Messaging.
 * Server-only. Used by /api/notifications/send (and any server code that
 * needs to notify users, e.g. new lead / post published).
 *
 * Tokens live on User.fcmToken: saved at app login and refreshed by
 * /api/notifications/register-token. Dead tokens are cleared automatically.
 */
import { messaging } from "@/lib/firebaseAdmin";
import User from "@/models/User";
import AutomationPlan from "@/models/AutomationPlan";

const FCM_BATCH_SIZE = 500; // sendEachForMulticast limit

// FCM errors that mean the token will never work again -> remove it from the user.
// (Not "invalid-argument": a bad payload, e.g. a broken image URL, also returns it.)
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

// FCM data payload values must be strings.
const DATA_KEYS = ["type", "screen", "action", "title", "message", "body", "image", "sound"];

function buildData(payload) {
  const data = {};
  for (const key of DATA_KEYS) {
    if (payload[key] !== undefined && payload[key] !== null) data[key] = String(payload[key]);
  }
  // Extra app routing data, e.g. { leadId: "123" }
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value !== undefined && value !== null) data[key] = String(value);
  }
  // Flutter needs this to handle taps in foreground/background
  data.click_action = "FLUTTER_NOTIFICATION_CLICK";
  return data;
}

// Notification sound: custom > lead-type default > system default
function soundFor(type, sound) {
  if (sound) return { android: sound, ios: `${sound}.caf` };
  if (type === "lead") return { android: "notification_sound", ios: "notification_sound.caf" };
  return { android: "default", ios: "default" };
}

function buildMessage(tokens, payload) {
  const { title, message, image, type } = payload;
  const sound = soundFor(type, payload.sound);
  return {
    tokens,
    notification: { title, body: message, ...(image ? { imageUrl: image } : {}) },
    data: buildData(payload),
    android: {
      priority: "high",
      notification: {
        channelId: "limbu_push_channel",
        sound: sound.android,
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
        ...(image ? { imageUrl: image } : {}),
      },
    },
    apns: { payload: { aps: { sound: sound.ios } } },
  };
}

/**
 * Sends one notification to many device tokens (batched by 500).
 * payload: { title, message, type?, screen?, action?, image?, sound?, data? }
 * Returns { successCount, failureCount, removedTokens, failed: [{ token, error }] }.
 */
export async function sendPushToTokens(tokens, payload) {
  const unique = [...new Set(tokens.filter(Boolean))];
  const result = { successCount: 0, failureCount: 0, removedTokens: 0, failed: [] };
  const dead = [];

  for (let i = 0; i < unique.length; i += FCM_BATCH_SIZE) {
    const batch = unique.slice(i, i + FCM_BATCH_SIZE);
    const res = await messaging().sendEachForMulticast(buildMessage(batch, payload));
    result.successCount += res.successCount;
    result.failureCount += res.failureCount;
    res.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code || "";
      result.failed.push({ token: batch[idx], error: r.error?.message || "Unknown error", code });
      if (DEAD_TOKEN_CODES.has(code)) dead.push(batch[idx]);
    });
  }

  if (dead.length) {
    const { modifiedCount } = await User.updateMany(
      { fcmToken: { $in: dead } },
      { $set: { fcmToken: null } }
    );
    result.removedTokens = modifiedCount;
  }

  return result;
}

/** Keeps the last 10 digits, so "+91 98912 34890" and "9891234890" match. */
function phoneVariants(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return [];
  const ten = digits.slice(-10);
  return [ten, `91${ten}`, `+91${ten}`, `0${ten}`];
}

// Cities with two common spellings; either one matches both.
const CITY_ALIASES = [
  ["gurgaon", "gurugram"],
  ["bangalore", "bengaluru"],
  ["bombay", "mumbai"],
  ["calcutta", "kolkata"],
  ["madras", "chennai"],
  ["noida", "gautam buddha nagar"],
];

function cityRegex(city) {
  const name = String(city || "").trim().toLowerCase();
  if (!name) return null;
  const names = CITY_ALIASES.find((group) => group.includes(name)) || [name];
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(escaped.join("|"), "i");
}

/**
 * userIds of everyone linked to a city: the user's own city, their Google
 * Business Profile address/city, or a location in their automation plan.
 */
async function userIdsInCity(city) {
  const re = cityRegex(city);
  if (!re) return [];
  const [fromUser, fromPlans] = await Promise.all([
    User.distinct("userId", {
      $or: [
        { city: re },
        { "gmbScraperData.city": re },
        { "gmbScraperData.address": re },
        { "businessReport.city": re },
      ],
    }),
    AutomationPlan.distinct("userId", { $or: [{ "locations.locality": re }, { "locations.address": re }] }),
  ]);
  return [...new Set([...fromUser, ...fromPlans].filter(Boolean).map(String))];
}

/**
 * Device tokens for a target:
 *   { token } | { tokens: [] } | { userId } | { userIds: [] } | { phone } | { city } | { all: true }
 * Returns { tokens, matchedUsers } (matchedUsers is null for raw tokens).
 */
export async function resolveTokens(target) {
  if (target.token || target.tokens?.length) {
    return { tokens: [target.token, ...(target.tokens || [])].filter(Boolean), matchedUsers: null };
  }

  let filter;
  if (target.all) filter = {};
  else if (target.userIds?.length) filter = { userId: { $in: target.userIds.map(String) } };
  else if (target.userId) filter = { userId: String(target.userId) };
  else if (target.phone) filter = { phone: { $in: phoneVariants(target.phone) } };
  else if (target.city) filter = { userId: { $in: await userIdsInCity(target.city) } };
  else return null; // no target given

  const users = await User.find({ ...filter, fcmToken: { $nin: [null, ""] } })
    .select("fcmToken")
    .lean();
  return { tokens: users.map((u) => u.fcmToken), matchedUsers: users.length };
}
