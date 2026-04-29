/**
 * Helper to strip base64 prefix
 */
export const stripBase64 = (str) => {
  if (typeof str === "string" && str.includes("base64,")) {
    return str.split("base64,")[1];
  }
  return str;
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

/**
 * Encode params for Meta Graph API POST bodies.
 * Graph expects application/x-www-form-urlencoded for many edges; JSON often fails.
 */
export function graphApiFormEncode(params) {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    // Manually encode to avoid URLSearchParams double-encoding
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join("&");
}

/**
 * Wait for Instagram video processing
 */
export async function waitForInstagramVideoContainer(
  creationId,
  accessToken,
  maxMs = 120000,
) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const u = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    u.searchParams.set("fields", "status_code");
    u.searchParams.set("access_token", accessToken);
    const r = await fetch(u.toString());
    const j = await r.json();
    if (j.status_code === "FINISHED") return;
    if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
      throw new Error(
        j.error?.message || `Instagram processing: ${j.status_code}`,
      );
    }
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error("Instagram video processing timed out.");
}
