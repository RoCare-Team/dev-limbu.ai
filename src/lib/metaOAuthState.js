import { normalizeMetaPhoneDigits } from "@/lib/metaChatbotResolveUser";

/**
 * Two OAuth `state` shapes — both must keep working:
 *
 * 1) **Dashboard (manual)** — `/api/facebook|instagram/login?userId=USR…` only.
 *    `state` is the raw `userId` string (no `m.` prefix). Callback saves to DB with
 *    that userId and redirects to `/dashboard?fb=connected` / `?ig=connected` (unchanged).
 *
 * 2) **Chatbot / connect-business** — login URL includes `?phone=…`.
 *    `state` is `m.<base64url JSON>` so callback can redirect back to `/connect-business`
 *    after success or error, while still using the same decoded `userId` for Mongo writes.
 */

function getBaseUrl() {
  return (process.env.BASE_URL || "").replace(/\/$/, "");
}

/**
 * @param {{ userId: string, phone: string, platform: 'fb' | 'ig', source?: 'chatbot' | 'manual' }} payload
 */
export function encodeMetaOAuthState(payload) {
  const phone = normalizeMetaPhoneDigits(payload.phone);
  const source =
    payload.source === "chatbot" || payload.source === "manual"
      ? payload.source
      : undefined;
  const json = JSON.stringify({
    u: payload.userId,
    p: phone,
    t: payload.platform,
    ...(source ? { s: source } : {}),
  });
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  return `m.${b64}`;
}

/**
 * @param {string | null | undefined} state
 * @returns {{ userId: string | null, phone: string, platform: 'fb'|'ig'|'', source: 'chatbot'|'manual'|'', isMetaReturn: boolean }}
 */
export function parseMetaOAuthState(state) {
  const raw = state && String(state).trim();
  if (!raw) {
    return {
      userId: null,
      phone: "",
      platform: "",
      source: "",
      isMetaReturn: false,
    };
  }
  if (!raw.startsWith("m.")) {
    return {
      userId: raw,
      phone: "",
      platform: "",
      source: "manual",
      isMetaReturn: false,
    };
  }
  try {
    const json = Buffer.from(raw.slice(2), "base64url").toString("utf8");
    const o = JSON.parse(json);
    const uid = typeof o.u === "string" && o.u.trim() ? o.u.trim() : null;
    const phone = normalizeMetaPhoneDigits(typeof o.p === "string" ? o.p : "");
    const t = o.t === "ig" ? "ig" : o.t === "fb" ? "fb" : "";
    const source =
      o.s === "chatbot" ? "chatbot" : o.s === "manual" ? "manual" : "";
    return {
      userId: uid,
      phone,
      platform: t,
      source,
      // Keep old behavior for already-issued links where `s` was not present.
      isMetaReturn: !!(
        uid &&
        phone &&
        (t === "fb" || t === "ig") &&
        (source === "chatbot" || source === "")
      ),
    };
  } catch {
    return {
      userId: null,
      phone: "",
      platform: "",
      source: "",
      isMetaReturn: false,
    };
  }
}

export function facebookSuccessRedirect(parsed) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&done=facebook`;
  }
  return `${base}/dashboard?fb=connected`;
}

export function facebookErrorRedirect(parsed, errorKey) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&fb_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?fb=${encodeURIComponent(errorKey)}`;
}

export function instagramSuccessRedirect(parsed, igCount = 1) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&done=instagram`;
  }
  return `${base}/dashboard?ig=connected&count=${igCount}`;
}

export function instagramErrorRedirect(parsed, errorKey) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&ig_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?ig=${encodeURIComponent(errorKey)}`;
}
