import { normalizeMetaPhoneDigits } from "@/lib/normalizeMetaPhoneDigits";

function getBaseUrl(override) {
  const o = (
    override ||
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  )
    .toString()
    .trim()
    .replace(/\/$/, "");
  if (o) return o;
  return "https://www.limbu.ai"; // ✅ www fix
}

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
    ...(payload.mobile ? { mob: 1 } : {}), // ✅ mobile flag encode
  });

  const b64 = Buffer.from(json, "utf8").toString("base64url");
  return `m.${b64}`;
}

export function parseMetaOAuthState(state) {
  const raw = state && String(state).trim();

  if (!raw) {
    return {
      userId: null,
      phone: "",
      platform: "",
      source: "",
      mobile: false, // ✅
      isMetaReturn: false,
    };
  }

  if (!raw.startsWith("m.")) {
    return {
      userId: raw,
      phone: "",
      platform: "",
      source: "manual",
      mobile: false, // ✅
      isMetaReturn: false,
    };
  }

  try {
    const json = Buffer.from(raw.slice(2), "base64url").toString("utf8");
    const o = JSON.parse(json);

    const uid =
      typeof o.u === "string" && o.u.trim() ? o.u.trim() : null;

    const phone = normalizeMetaPhoneDigits(
      typeof o.p === "string" ? o.p : ""
    );

    const t = o.t === "ig" ? "ig" : o.t === "fb" ? "fb" : "";

    const source =
      o.s === "chatbot"
        ? "chatbot"
        : o.s === "manual"
        ? "manual"
        : "";

    const mobile = o.mob === 1; // ✅ mobile parse

    return {
      userId: uid,
      phone,
      platform: t,
      source,
      mobile, // ✅ return
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
      mobile: false, // ✅
      isMetaReturn: false,
    };
  }
}

export function facebookSuccessRedirect(parsed, originOverride) {
  const base = getBaseUrl(originOverride);
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&done=facebook`;
  }
  return `${base}/dashboard?fb=connected`;
}

export function facebookErrorRedirect(parsed, errorKey, originOverride) {
  const base = getBaseUrl(originOverride);
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&fb_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?fb=${encodeURIComponent(errorKey)}`;
}

export function instagramSuccessRedirect(parsed, igCount = 1, originOverride) {
  const base = getBaseUrl(originOverride);
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&done=instagram`;
  }
  return `${base}/dashboard?ig=connected&count=${igCount}`;
}

export function instagramErrorRedirect(parsed, errorKey, originOverride) {
  const base = getBaseUrl(originOverride);
  if (parsed.isMetaReturn && parsed.phone) {
    return `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&ig_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?ig=${encodeURIComponent(errorKey)}`;
}