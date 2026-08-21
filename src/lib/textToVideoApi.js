/* ----------------------------------------------------
   LIMBU TEXT-TO-VIDEO API WRAPPER
   Central place that knows how to talk to the external
   Limbu text-to-video generation service. Nothing outside
   this file should hardcode the endpoint URL or API key —
   routes/pages call `generateVideo()` instead.
---------------------------------------------------- */

const TEXTTOVIDEO_API_URL =
  process.env.TEXTTOVIDEO_API_URL || "https://texttovideo.limbutech.in/api/generate-video";
const TEXTTOVIDEO_API_KEY =
  process.env.TEXTTOVIDEO_API_KEY ||
  "7f3a9c2e8b1d4f6a0e5c3b8d2a7f1e9c4b6d8a0f2e5c7b9d1a3f6e8c0b2d4a7f";

const DEFAULT_TIMEOUT_MS = 890 * 1000; // keep just under the route's 900s maxDuration

/**
 * Calls the Limbu text-to-video API and returns a normalized result.
 *
 * @param {Object} params
 * @param {string} params.businessName
 * @param {string} [params.text]      - plain offer brief (mutually exclusive with script)
 * @param {string} [params.script]    - ready-made script (mutually exclusive with text)
 * @param {string} [params.language]  - only applied when using `text`
 * @param {string} [params.keywords]
 * @param {string} [params.presenterGender] - "male" | "female"
 * @param {boolean} [params.wait=true]
 * @param {Record<string, File|Blob>} [params.files] - logo/character/background/product
 * @param {number} [params.timeoutMs]
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function generateVideo({
  businessName,
  text,
  script,
  language,
  keywords,
  presenterGender,
  wait = true,
  files = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!businessName || (!text && !script)) {
    throw new Error("businessName and either text or script are required.");
  }

  const form = new FormData();
  form.append("business_name", businessName);

  if (script) {
    form.append("script", script);
  } else {
    form.append("text", text);
    if (language) form.append("language", language);
  }

  form.append("wait", wait ? "true" : "false");
  if (keywords) form.append("keywords", keywords);
  if (presenterGender) form.append("presenter_gender", presenterGender);

  for (const [field, file] of Object.entries(files)) {
    if (file && typeof file === "object" && file.size > 0) {
      form.append(field, file, file.name);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(TEXTTOVIDEO_API_URL, {
      method: "POST",
      headers: { "X-API-Key": TEXTTOVIDEO_API_KEY },
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }

  return { ok: res.ok, status: res.status, data };
}
