/**
 * Absolute origin (no trailing slash) for Meta OAuth `redirect_uri`.
 * Must match exactly what is listed in the Meta app and what the callback uses for token exchange.
 *
 * 1. `BASE_URL` when set and not loopback — same as legacy `${BASE_URL}/api/.../callback`.
 * 2. Else `x-forwarded-host` / non-local `req.url` / other public env / `VERCEL_URL` /
 *    `Host` header, then localhost `req.url` for local dev, then default.
 */
function trimOrigin(s) {
  return String(s || "").trim().replace(/\/$/, "");
}

function firstHeader(value) {
  if (value == null) return "";
  return String(value).split(",")[0]?.trim() || "";
}

function isLoopbackHostname(hostname) {
  const h = (hostname || "").toLowerCase();
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "0.0.0.0")
    return true;
  return h.endsWith(".local");
}

function originFromHostAndProto(hostHeader, protoHeader) {
  const host = firstHeader(hostHeader);
  if (!host) return null;
  const hostname = host.split(":")[0];
  if (isLoopbackHostname(hostname)) return null;
  const proto = (firstHeader(protoHeader) || "https").replace(/:$/, "");
  return `${proto}://${host}`.replace(/\/$/, "");
}

function originFromRequestUrl(req) {
  if (!req?.url) return null;
  try {
    const u = new URL(req.url);
    if (u.protocol && u.host) {
      return `${u.protocol}//${u.host}`.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveOAuthRedirectOrigin(req) {
  const headers = req?.headers;

  // 1. The ACTUAL public host this request arrived on (proxy-aware). This is the
  //    "same URI the user is on" — always prefer it so the redirect matches the
  //    live domain instead of a possibly-stale env value.
  const forwarded = originFromHostAndProto(
    headers?.get("x-forwarded-host"),
    headers?.get("x-forwarded-proto"),
  );
  if (forwarded) return forwarded;

  // 2. Plain Host header (non-loopback).
  const fromHostHeader = originFromHostAndProto(
    headers?.get("host"),
    headers?.get("x-forwarded-proto"),
  );
  if (fromHostHeader) return fromHostHeader;

  // 3. Origin parsed from the request URL (non-loopback).
  const fromUrl = originFromRequestUrl(req);
  if (fromUrl) {
    try {
      if (!isLoopbackHostname(new URL(fromUrl).hostname)) return fromUrl;
    } catch {
      /* ignore */
    }
  }

  // 4. Explicitly configured origins (only used when the request host is
  //    unavailable, e.g. background jobs without an incoming request).
  const configuredBase = trimOrigin(process.env.BASE_URL);
  if (configuredBase) {
    try {
      if (!isLoopbackHostname(new URL(configuredBase).hostname)) return configuredBase;
    } catch {
      /* malformed BASE_URL — fall through */
    }
  }

  const fromEnv = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ]
    .map(trimOrigin)
    .find(Boolean);

  if (fromEnv) return fromEnv;

  const vercel = trimOrigin(process.env.VERCEL_URL);
  if (vercel && !isLoopbackHostname(vercel.split(":")[0])) {
    return `https://${vercel}`;
  }

  // 5. Local dev fallback (loopback allowed here as a last resort).
  const fallbackLocal = originFromRequestUrl(req);
  if (fallbackLocal) return fallbackLocal;

  return "https://limbu.ai";
}
