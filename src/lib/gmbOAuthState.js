function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  if (!value) return {};
  try {
    const raw = String(value).startsWith("g.") ? String(value).slice(2) : value;
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

export function buildGmbOAuthState(payload) {
  return `g.${base64UrlEncode({
    userId: payload.userId || "",
    phone: payload.phone || "",
    source: payload.source || "dashboard",
    mobile: Boolean(payload.mobile),
  })}`;
}

export function parseGmbOAuthState(state) {
  return base64UrlDecode(state);
}

export function gmbSuccessRedirect(parsed, origin) {
  const base = String(origin || "https://limbu.ai").replace(/\/$/, "");
  if (parsed?.phone && parsed?.source === "chatbot") {
    return `${base}/connect-business?type=gmb&phone=${encodeURIComponent(parsed.phone)}&done=gmb`;
  }
  return `${base}/dashboard?gmb=connected`;
}

export function gmbErrorRedirect(parsed, errorKey, origin) {
  const base = String(origin || "https://limbu.ai").replace(/\/$/, "");
  if (parsed?.phone && parsed?.source === "chatbot") {
    return `${base}/connect-business?type=gmb&phone=${encodeURIComponent(parsed.phone)}&gmb_error=${encodeURIComponent(errorKey)}`;
  }
  return `${base}/dashboard?gmb_error=${encodeURIComponent(errorKey)}`;
}
