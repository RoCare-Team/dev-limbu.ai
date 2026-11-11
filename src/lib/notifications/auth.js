/**
 * Who may call the notification APIs. Server-only.
 *
 * App users and admins get JWTs signed with the same JWT_SECRET, so a valid
 * signature alone does not prove admin: the admin token carries `role`, a user
 * token carries `userId` and no role.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

// Admin roles allowed to send notifications.
const SENDER_ROLES = new Set(["admin", "superAdmin", "seniorManager"]);

function bearerPayload(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Sending is allowed for an admin JWT with a sender role, or for other servers
 * with header `x-api-key: <NOTIFICATION_API_KEY>`. Returns { status, message } or null.
 */
export function checkSender(req) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const expected = process.env.NOTIFICATION_API_KEY;
    return expected && safeEqual(apiKey, expected) ? null : { status: 401, message: "Invalid API key" };
  }
  const payload = bearerPayload(req);
  if (!payload) return { status: 401, message: "Unauthorized" };
  return SENDER_ROLES.has(payload.role)
    ? null
    : { status: 403, message: "Only admins can send notifications" };
}

/** The logged-in app user's userId from their Bearer token, or null. */
export function appUserId(req) {
  const payload = bearerPayload(req);
  return payload?.userId && !payload.role ? String(payload.userId) : null;
}
