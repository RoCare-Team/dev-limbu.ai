// Shared helpers for the CGI Product Ad Generator (https://cgi-video.limbutech.in).
// Server-only: the API key must never reach the browser.

export const CGI_VIDEO_API_URL =
  process.env.CGI_VIDEO_API_URL || "https://cgi-video.limbutech.in";

// The upstream only enforces X-API-Key when it has API_KEY configured, so the
// header is sent only when we actually have a key.
export function cgiVideoHeaders() {
  const key = process.env.CGI_VIDEO_API_KEY;
  return key ? { "X-API-Key": key } : {};
}

export async function readUpstreamJson(res) {
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

// Upstream errors are `{ detail: string }`, except FastAPI's own 422 which
// returns `{ detail: [{ loc, msg }] }` — flatten both into one message.
export function upstreamErrorMessage(status, data, fallback) {
  const detail = data?.detail;
  let message = null;

  if (typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d?.msg}` : d?.msg;
      })
      .filter(Boolean)
      .join("; ");
  }

  if (status === 401) {
    // Our key is wrong/missing — a server config problem, not something the user can fix.
    console.error("CGI VIDEO API rejected the API key:", message);
    return "CGI video service is not configured correctly. Please contact support.";
  }
  if (status === 503) {
    return message || "CGI video storage is not configured on the server. Please contact support.";
  }
  return message || fallback;
}
