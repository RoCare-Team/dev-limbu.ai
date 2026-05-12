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
  const configuredBase = trimOrigin(process.env.BASE_URL);
  if (configuredBase) {
    try {
      if (!isLoopbackHostname(new URL(configuredBase).hostname)) return configuredBase;
    } catch {
      /* malformed BASE_URL — fall through */
    }
  }

  const headers = req?.headers;

  const forwarded = originFromHostAndProto(
    headers?.get("x-forwarded-host"),
    headers?.get("x-forwarded-proto"),
  );
  if (forwarded) return forwarded;

  const fromUrl = originFromRequestUrl(req);
  if (fromUrl) {
    try {
      const hostname = new URL(fromUrl).hostname;
      if (!isLoopbackHostname(hostname)) return fromUrl;
    } catch {
      /* ignore */
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

  const fromHostHeader = originFromHostAndProto(headers?.get("host"), headers?.get("x-forwarded-proto"));
  if (fromHostHeader) return fromHostHeader;

  const fallbackLocal = originFromRequestUrl(req);
  if (fallbackLocal) return fallbackLocal;

  return "https://limbu.ai";
}
