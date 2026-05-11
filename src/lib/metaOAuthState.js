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
 * @param {{ userId: string, phone: string, platform: 'fb' | 'ig' }} payload
 */
export function encodeMetaOAuthState(payload) {
  const phone = normalizeMetaPhoneDigits(payload.phone);
  const json = JSON.stringify({
    u: payload.userId,
    p: phone,
    t: payload.platform,
  });
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  return `m.${b64}`;
}

/**
 * @param {string | null | undefined} state
 * @returns {{ userId: string | null, phone: string, platform: 'fb'|'ig'|'', isMetaReturn: boolean }}
 */
export function parseMetaOAuthState(state) {
  const raw = state && String(state).trim();
  if (!raw) {
    return { userId: null, phone: "", platform: "", isMetaReturn: false };
  }
  if (!raw.startsWith("m.")) {
    return {
      userId: raw,
      phone: "",
      platform: "",
      isMetaReturn: false,
    };
  }
  try {
    const json = Buffer.from(raw.slice(2), "base64url").toString("utf8");
    const o = JSON.parse(json);
    const uid = typeof o.u === "string" && o.u.trim() ? o.u.trim() : null;
    const phone = normalizeMetaPhoneDigits(typeof o.p === "string" ? o.p : "");
    const t = o.t === "ig" ? "ig" : o.t === "fb" ? "fb" : "";
    return {
      userId: uid,
      phone,
      platform: t,
      isMetaReturn: !!(uid && phone && (t === "fb" || t === "ig")),
    };
  } catch {
    return { userId: null, phone: "", platform: "", isMetaReturn: false };
  }
}

export function facebookSuccessRedirect(parsed) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&phone=${encodeURIComponent(parsed.phone)}&done=facebook`;
  }
  return `${base}/dashboard?fb=connected`;
}

export function facebookErrorRedirect(parsed, errorKey) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&phone=${encodeURIComponent(parsed.phone)}&fb_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?fb=${encodeURIComponent(errorKey)}`;
}

export function instagramSuccessRedirect(parsed, igCount = 1) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&phone=${encodeURIComponent(parsed.phone)}&done=instagram`;
  }
  return `${base}/dashboard?ig=connected&count=${igCount}`;
}

export function instagramErrorRedirect(parsed, errorKey) {
  const base = getBaseUrl();
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&phone=${encodeURIComponent(parsed.phone)}&ig_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?ig=${encodeURIComponent(errorKey)}`;
}
