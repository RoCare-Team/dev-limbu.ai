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
  return "https://www.limbu.ai";
}

export function encodeMetaOAuthState(payload) {
  const phone = normalizeMetaPhoneDigits(payload.phone);
  const source =
    payload.source === "chatbot" || payload.source === "manual"
      ? payload.source
      : undefined;

  // ✅ FIX: mob: true (boolean) — pehle mob: 1 (number) tha jo parse mein mismatch deta tha
  const stateObj = {
    u: payload.userId,
    p: phone,
    t: payload.platform,
    ...(source ? { s: source } : {}),
    ...(payload.mobile ? { mob: true } : {}),
  };

  console.log("🔐 [encodeMetaOAuthState] Input payload:", {
    userId: payload.userId,
    mobile: payload.mobile,
    platform: payload.platform,
    source: payload.source,
    phone: phone || "(none)",
  });
  console.log("🔐 [encodeMetaOAuthState] State object being encoded:", JSON.stringify(stateObj));

  const json = JSON.stringify(stateObj);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const encoded = `m.${b64}`;

  console.log("🔐 [encodeMetaOAuthState] Final encoded state (first 60 chars):", encoded.substring(0, 60));

  return encoded;
}

export function parseMetaOAuthState(state) {
  const raw = state && String(state).trim();

  console.log("🔍 [parseMetaOAuthState] Raw state received:", raw ? raw.substring(0, 60) + "..." : "(empty)");

  if (!raw) {
    console.warn("⚠️ [parseMetaOAuthState] Empty state — returning defaults");
    return {
      userId: null,
      phone: "",
      platform: "",
      source: "",
      mobile: false,
      isMetaReturn: false,
    };
  }

  if (!raw.startsWith("m.")) {
    console.warn("⚠️ [parseMetaOAuthState] State does not start with 'm.' — treating as plain userId:", raw);
    return {
      userId: raw,
      phone: "",
      platform: "",
      source: "manual",
      mobile: false,
      isMetaReturn: false,
    };
  }

  try {
    const json = Buffer.from(raw.slice(2), "base64url").toString("utf8");
    const o = JSON.parse(json);

    console.log("🔍 [parseMetaOAuthState] Decoded JSON:", JSON.stringify(o));
    console.log("🔍 [parseMetaOAuthState] mob field — value:", o.mob, "| type:", typeof o.mob);

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

    // ✅ FIX: mob === true (boolean) aur mob === 1 (number legacy) dono handle
    const mobile = o.mob === true || o.mob === 1;

    const isMetaReturn = !!(
      uid &&
      phone &&
      (t === "fb" || t === "ig") &&
      (source === "chatbot" || source === "")
    );

    const result = { userId: uid, phone, platform: t, source, mobile, isMetaReturn };

    console.log("✅ [parseMetaOAuthState] Parsed result:", {
      userId: uid,
      mobile,
      platform: t,
      source,
      isMetaReturn,
      phone: phone || "(none)",
    });

    return result;
  } catch (err) {
    console.error("💥 [parseMetaOAuthState] Failed to decode state:", err.message);
    console.error("💥 [parseMetaOAuthState] Raw state was:", raw);
    return {
      userId: null,
      phone: "",
      platform: "",
      source: "",
      mobile: false,
      isMetaReturn: false,
    };
  }
}

export function facebookSuccessRedirect(parsed, originOverride) {
  const base = getBaseUrl(originOverride);
  const url = parsed.isMetaReturn && parsed.phone
    ? `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&done=facebook`
    : `${base}/dashboard?fb=connected`;
  console.log("🎯 [facebookSuccessRedirect] Redirecting to:", url);
  return url;
}

export function facebookErrorRedirect(parsed, errorKey, originOverride) {
  const base = getBaseUrl(originOverride);
  const url = parsed.isMetaReturn && parsed.phone
    ? `${base}/connect-business?type=meta&platform=facebook&phone=${encodeURIComponent(parsed.phone)}&fb_error=${encodeURIComponent(errorKey)}`
    : `${base}/dashboard?fb=${encodeURIComponent(errorKey)}`;
  console.log("❌ [facebookErrorRedirect] Redirecting to:", url, "| error:", errorKey);
  return url;
}

export function instagramSuccessRedirect(parsed, igCount = 1, originOverride) {
  const base = getBaseUrl(originOverride);
  const url = parsed.isMetaReturn && parsed.phone
    ? `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&done=instagram`
    : `${base}/dashboard?ig=connected&count=${igCount}`;
  console.log("🎯 [instagramSuccessRedirect] Redirecting to:", url);
  return url;
}

export function instagramErrorRedirect(parsed, errorKey, originOverride) {
  const base = getBaseUrl(originOverride);
  const url = parsed.isMetaReturn && parsed.phone
    ? `${base}/connect-business?type=meta&platform=instagram&phone=${encodeURIComponent(parsed.phone)}&ig_error=${encodeURIComponent(errorKey)}`
    : `${base}/dashboard?ig=${encodeURIComponent(errorKey)}`;
  console.log("❌ [instagramErrorRedirect] Redirecting to:", url, "| error:", errorKey);
  return url;
}