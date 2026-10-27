/* ----------------------------------------------------
   LIMBU TEXT-TO-VIDEO API WRAPPER
   Central place that knows how to talk to the external
   Limbu text-to-video generation service. Nothing outside
   this file should hardcode the endpoint URL or API key —
   routes/pages call `generateVideo()` instead.
---------------------------------------------------- */

const TEXTTOVIDEO_API_URL =
  process.env.TEXTTOVIDEO_API_URL || "https://texttovideo.limbutech.in/api/generate-video";
// GET {origin}/api/task/{task_id} — polled while wait=false generations run.
const TEXTTOVIDEO_TASK_URL = `${new URL(TEXTTOVIDEO_API_URL).origin}/api/task`;
const TEXTTOVIDEO_API_KEY = process.env.TEXTTOVIDEO_API_KEY || "DxWOW1vHj2W96WB8MaLcSFYeq";

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
 * @param {number} [params.duration] - target video length in seconds (10 | 20)
 * @param {boolean} [params.captions] - burned-in captions + per-platform post copy (API default true)
 * @param {boolean} [params.presenterLed] - allow a mostly talking-head ad (API default false)
 * @param {string} [params.visualStyle] - "auto" | "cinematic" | "infographic" | "hybrid"
 * @param {string} [params.onScreenLabels] - up to 3 headings separated by "|"
 * @param {boolean} [params.wait=true] - false returns a task_id at once; poll it with getVideoTask()
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
  duration,
  captions,
  presenterLed,
  visualStyle,
  onScreenLabels,
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
  if (duration) form.append("duration", String(duration));
  if (typeof captions === "boolean") form.append("captions", String(captions));
  if (typeof presenterLed === "boolean") form.append("presenter_led", String(presenterLed));
  if (visualStyle) form.append("visual_style", visualStyle);
  if (onScreenLabels) form.append("on_screen_labels", onScreenLabels);

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

/**
 * Status of a wait=false generation. `data.status` is one of queued |
 * generating_script | generating_video | merging | checking_audio | uploading |
 * success | failed; `video_url` is set on success, `error` on failure.
 *
 * @param {string} taskId
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
export async function getVideoTask(taskId) {
  const res = await fetch(`${TEXTTOVIDEO_TASK_URL}/${encodeURIComponent(taskId)}`, {
    headers: { "X-API-Key": TEXTTOVIDEO_API_KEY },
    cache: "no-store",
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }

  return { ok: res.ok, status: res.status, data };
}
