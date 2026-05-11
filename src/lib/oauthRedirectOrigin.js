/**
 * Absolute origin (no trailing slash) for Meta OAuth `redirect_uri`.
 * Must match exactly the URL the user hit and what is listed in the Meta app.
 *
 * Prefer the incoming request so apex vs www always matches the browser
 * (fixes token exchange when BASE_URL is missing or points at a different host).
 */
export function resolveOAuthRedirectOrigin(req) {
  if (req?.url) {
    try {
      const u = new URL(req.url);
      if (u.protocol && u.host) {
        return `${u.protocol}//${u.host}`.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
  }

  const fromEnv = [
    process.env.BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ]
    .map((s) => String(s || "").trim().replace(/\/$/, ""))
    .find(Boolean);

  if (fromEnv) return fromEnv;

  const host =
    req?.headers?.get?.("x-forwarded-host") || req?.headers?.get?.("host");
  const proto = req?.headers?.get?.("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return "https://limbu.ai";
}
