/**
 * Shared GPT + /api/aiAssetsGenerate helpers for automation cron
 * (prefetch in auto-post + inline fallback in automation-plans publish).
 */

import { normalizePlatformDescriptions } from "@/utils/aiPostDescriptions";
import {
  writeAutomationCaptions,
  getRecentOpenings,
  pickAngle,
} from "@/lib/automationCaptionWriter";

export function getAutomationCronBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

export const ASSET_SLOTS = [
  "characterImage",
  "uniformImage",
  "productImage",
  "backgroundImage",
  "logoImage",
];

/**
 * Picks ONE image per slot for the post at `index`.
 *
 * A slot with a pool rotates through it in order — index 0 takes the first
 * image, index 1 the second, and it only repeats once the pool is exhausted.
 * A slot without a pool keeps using its single configured image, exactly as
 * before pools existed.
 */
export function resolveImagesForIndex(imageConfig = {}, index = 0, dateKey = "") {
  const pools = imageConfig.pools || {};
  const next = { ...imageConfig };
  const i = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;

  // What the user pinned for this exact day, if anything.
  const pinned =
    (dateKey &&
      (imageConfig.overrides || []).find((o) => o?.date === dateKey)?.images) ||
    {};

  for (const slot of ASSET_SLOTS) {
    if (pinned[slot]) {
      next[slot] = pinned[slot];
      continue;
    }
    const pool = Array.isArray(pools[slot]) ? pools[slot].filter(Boolean) : [];
    if (pool.length) next[slot] = pool[i % pool.length];
  }
  return next;
}

/** Strip disabled asset slots before calling aiAssetsGenerate */
export function applyIncludeInGeneration(imageConfig = {}) {
  const inc = imageConfig.includeInGeneration || {};
  const next = { ...imageConfig };
  for (const k of [
    "characterImage",
    "uniformImage",
    "productImage",
    "backgroundImage",
    "logoImage",
  ]) {
    if (inc[k] === false) next[k] = null;
  }
  return next;
}

async function callGpt(systemPrompt, userPrompt, maxTokens = 400) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[automation-content] OPENAI_API_KEY not set — GPT call skipped",
    );
    return null;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    console.log("[automation-content] GPT raw:", raw.slice(0, 250));
    return JSON.parse(raw.replace(/^```(?:json)?|```$/gm, "").trim());
  } catch (err) {
    console.error("[automation-content] GPT error:", err.message);
    return null;
  }
}

/**
 * A different shot for each slot.
 *
 * Without this every prompt asked for the same thing — one hero subject,
 * eye-level, soft light — so a client's feed became twelve near-identical
 * frames. Rotating the treatment alongside the caption angle means consecutive
 * posts look like a campaign rather than a repeat.
 */
const VISUAL_TREATMENTS = [
  "a tight hero close-up of the product or service detail, shallow depth of field, 85mm",
  "a wider environmental shot showing the clean workspace or storefront interior, 24mm",
  "a candid in-action moment — hands mid-work, genuine focus, slight motion, 50mm",
  "a macro detail shot of texture, finish or craft, strong directional light",
  "a warm two-person moment: staff member with a satisfied customer, eye-level, 35mm",
  "a tidy flat-lay / top-down arrangement of the tools or products on a clean surface",
  "a bright natural-light portrait of the professional at work, soft window light, 50mm",
  "a before-and-after style single frame showing the finished result in use",
];

export async function generateImagePrompt({
  keyword,
  businessName,
  cityName,
  postIndex = 0,
}) {
  const fallback = `${keyword} — ${businessName}${cityName ? ", " + cityName : ""}`;
  const cityLine = cityName ? `City / locality : "${cityName}", India` : "";
  const i = Number.isFinite(postIndex) && postIndex >= 0 ? Math.floor(postIndex) : 0;
  const treatment = VISUAL_TREATMENTS[i % VISUAL_TREATMENTS.length];
  // Same slot counter the caption angle uses, so the picture and the words are
  // telling the same story.
  const angle = pickAngle(i);
  const result = await callGpt(
    [
      "You are a senior commercial advertising photographer and art director.",
      "You write single, production-ready prompts for a text-to-image model that generates premium 3:4 (portrait 1080x1350) social + Google Business ad creatives for local Indian businesses.",
      "Your prompts consistently produce clean, photorealistic, brand-safe, high-converting visuals.",
      "Return ONLY compact minified JSON, no markdown, no commentary.",
    ].join(" "),
    `Business name  : "${businessName}"
Offer / keyword: "${keyword}"
${cityLine}

TASK: Write ONE vivid, camera-ready image prompt for a scroll-stopping ad that visually sells "${keyword}" for this business.

REQUIRED SHOT for this post (follow it — do not substitute a generic hero shot):
${treatment}

The post's written angle is "${angle.key}" — ${angle.brief}
Make the picture support THAT angle specifically, not a generic advert.

Build the prompt to cover, in a single flowing paragraph (45-75 words):
1. HERO SUBJECT — the exact product / service / person most relevant to "${keyword}" (be concrete and authentic to an Indian local business).
2. SETTING & ACTION — a realistic, tidy, aspirational scene${cityName ? `, subtly relatable to ${cityName}, India` : ""}.
3. CAMERA & LIGHT — use the required shot above for lens & framing, with soft natural or studio lighting, appropriate depth of field, and a professional colour grade / mood.
4. QUALITY CUES — "photorealistic, ultra-detailed, sharp focus, 4K, commercial advertising photography, premium".
5. COMPOSITION — keep clean, uncluttered negative space, and ALWAYS keep the TOP RIGHT CORNER completely empty/clean (plain, low-detail area) reserved for the brand logo, plus space for text and phone number to be added later.

HARD RULES:
- Absolutely NO text, letters, words, numbers, captions, watermarks, logos, badges, posters or UI anywhere in the image (all branding is composited later).
- The brand logo is supplied separately and is composited AFTER generation — it must be used EXACTLY as provided: never redraw, recolour, restyle, resize unusually, translate, distort or reinterpret it; the original logo pixels stay unchanged.
- The logo ALWAYS sits in the TOP RIGHT CORNER, at a consistent scale — never move, rotate, mirror or place it in any other corner/position, and never overlap it with other elements.
- Keep the top-right corner plain, low-contrast and uncluttered (no busy texture, no bright highlight, no subject overlapping it) so the logo stays clearly legible once composited.
- No distorted anatomy, no extra fingers, no messy/cluttered background, no collage, no borders.
- Brand-safe, modern, premium, realistic — never cartoonish unless the business clearly calls for it.
- Prioritise sharp focus, correct proportions and clean commercial-grade composition over busy/experimental styling — consistency and quality over novelty.

Return ONLY: {"prompt":"..."}`,
    380,
  );
  const prompt = result?.prompt || fallback;
  console.log("[automation-content] Image prompt:", prompt);
  return prompt;
}

/**
 * Single source of truth for automation content: calls the SAME webhook used by
 * post-management ("Assets" flow) — /api/aiAssetsGenerate → assets-image.limbutech.in/generate-ad.
 * That one response returns BOTH the image (data.output) and DISTINCT per-platform
 * captions (gmb_des, fb_des, ig_des, pin_des, ...). We request all platforms so each
 * platform gets its OWN caption (not a shared GMB one), all in one webhook call.
 *
 * Returns { imageUrl: string|null, postText: string, descriptions: {gmb, fb, ig, pin, pinTitle, yt} }.
 */
export async function generateImageAndText({
  imagePrompt,
  keyword,
  businessName,
  cityName,
  imageConfig = {},
  postIndex = 0,
  // "YYYY-MM-DD" of the day this post publishes, in the plan's timezone.
  publishDateKey = "",
  platforms,
  // Business context for the caption writer. The more of this the caller
  // passes, the less generic the captions are — all of it is optional.
  userId = "",
  services = [],
  businessDescription = "",
  websiteUrl = "",
  phone = "",
} = {}) {
  const BASE_URL = getAutomationCronBaseUrl();
  // A pinned day wins; otherwise rotate the pools. Then drop switched-off slots.
  const cfg = applyIncludeInGeneration(
    resolveImagesForIndex(imageConfig, postIndex, publishDateKey),
  );
  /**
   * generate-ad sirf RAW BASE64 leta hai.
   *
   * Pool me daali hui images S3 **URL** ki tarah save hoti hain (admin upload
   * karta hai to wahi URL milta hai), aur URL seedha bhej dene par upstream
   * HTTP 500 deta tha → imageUrl null → poora din ka post "aiAssetsGenerate
   * down?" keh kar fail. Isliye URL ko yahin download karke base64 banao.
   *
   * Image na mil paaye to khaali string — background ke bina post ban jaana
   * poore post ke fail hone se behtar hai.
   */
  const cleanB64 = async (s) => {
    if (typeof s !== "string" || !s) return "";
    if (s.startsWith("data:image")) return s.split(",")[1];
    if (!/^https?:\/\//i.test(s)) return s;

    try {
      const res = await fetch(s);
      if (!res.ok) {
        console.warn(
          `[automation-content] pool image fetch failed (HTTP ${res.status}): ${s.slice(0, 120)}`,
        );
        return "";
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.toString("base64");
    } catch (err) {
      console.warn(
        `[automation-content] pool image fetch error: ${err.message} — ${s.slice(0, 120)}`,
      );
      return "";
    }
  };

  const textFallback = `${keyword} | ${businessName}${cityName ? " — " + cityName : ""}`;

  // Always ask the webhook for EVERY platform's caption in one shot so gmb/fb/ig/
  // pinterest each get their OWN distinct text — never a reused GMB caption. We
  // request the full set regardless of which platforms the plan posts to; unused
  // fields are simply ignored, but the ones we publish are always platform-native.
  const requested = ["gmb", "fb", "ig", "pinterest"];

  // Saare slots ek saath resolve karo — pool URLs download hone par bhi ye
  // parallel chalte hain, isliye extra wall-clock nahi lagta.
  const [characterImage, uniformImage, productImage, backgroundImage, logoImage] =
    await Promise.all([
      cleanB64(cfg.characterImage),
      cleanB64(cfg.uniformImage),
      cleanB64(cfg.productImage),
      cleanB64(cfg.backgroundImage),
      cleanB64(cfg.logoImage),
    ]);

  const payload = {
    topic: imagePrompt || keyword || "",
    bussiness_name: businessName || "",
    keywords: keyword || "",
    colourPalette: cfg.colourPalette || "",
    size: cfg.size || "4:3",
    characterImage,
    uniformImage,
    productImage,
    backgroundImage,
    logoImage,
    platform: requested.join(","),
    mode: "ai",
  };

  console.log(
    "[automation-content] aiAssetsGenerate —",
    `${BASE_URL}/api/aiAssetsGenerate`,
  );

  // Write the captions ourselves, in parallel with the image call so this costs
  // no extra wall-clock. The webhook's own captions stay as the fallback: they
  // publish fine, they are just formulaic (measured: 53% of this platform's
  // Instagram captions used to open with the same word).
  const ourCaptionsPromise = (async () => {
    try {
      const recentOpenings = await getRecentOpenings(userId);
      return await writeAutomationCaptions({
        businessName,
        cityName,
        keyword,
        services,
        businessDescription,
        websiteUrl,
        phone,
        postIndex,
        recentOpenings,
      });
    } catch (err) {
      console.error("[automation-content] caption writer failed:", err.message);
      return null;
    }
  })();

  // Retry a few times: the upstream service (assets-image.limbutech.in) can be
  // briefly unreachable / slow. Without retries a single blip drops the whole
  // day's post (imageUrl null → empty-bundle safety gate aborts it).
  const MAX_ATTEMPTS = Math.max(
    1,
    Number(process.env.AUTOMATION_IMAGE_RETRIES) || 3,
  );
  const RETRY_DELAY_MS = Math.max(
    1000,
    Number(process.env.AUTOMATION_IMAGE_RETRY_DELAY_MS) || 5000,
  );

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/aiAssetsGenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(
        `[automation-content] aiAssetsGenerate HTTP status (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        res.status,
      );

      const json = await res.json();
      const d = json?.data;
      const imageUrl =
        d?.imageUrl ||
        d?.url ||
        d?.image ||
        d?.output ||
        (Array.isArray(d)
          ? d[0]?.imageUrl || d[0]?.url || d[0]?.image
          : null) ||
        null;

      if (imageUrl) {
        // Same response also carries DISTINCT per-platform captions — extract with
        // the SAME normalizer post-management uses.
        const norm = normalizePlatformDescriptions({ ...json, ...d });
        const gmb = (norm.gmb_des || d?.description || "").trim();
        const webhookText =
          gmb || (norm.fb_des || norm.ig_des || "").trim() || textFallback;

        // Our own captions if they arrived, the webhook's if they did not.
        const ours = await ourCaptionsPromise;
        const postText = (ours?.gmb || webhookText).trim();

        // Each platform keeps its own caption; fall back to the GMB text only when
        // that platform's caption is missing so no field is ever empty.
        const descriptions = {
          gmb: postText,
          fb: (ours?.fb || norm.fb_des || "").trim() || postText,
          ig: (ours?.ig || norm.ig_des || "").trim() || postText,
          li: (ours?.li || norm.li_des || "").trim() || postText,
          pin: (ours?.pin || norm.pin_des || "").trim() || postText,
          pinTitle: (ours?.pinTitle || norm.pin_title || "").trim(),
          yt: (ours?.yt || norm.yt_des || "").trim() || postText,
        };
        console.log(
          `[automation-content] captions by ${ours ? "caption-writer (angle=" + ours.angle + ")" : "webhook fallback"}`,
        );
        // NOTE: Keep any {city} placeholder INTACT here. The gmb-post upstream
        // (via /api/gmb/publish) replaces {city} per location using each
        // location's cityName, so a single generated caption serves all
        // locations with the correct city. Do NOT substitute at generation time.
        console.log("[automation-content] Extracted imageUrl:", imageUrl);
        console.log("[automation-content] Per-platform text:", {
          gmb: descriptions.gmb.slice(0, 40),
          fb: descriptions.fb.slice(0, 40),
          ig: descriptions.ig.slice(0, 40),
          pin: descriptions.pin.slice(0, 40),
        });
        return { imageUrl, postText, descriptions };
      }
      console.warn(
        `[automation-content] attempt ${attempt}/${MAX_ATTEMPTS} returned no imageUrl (status ${res.status}, ${json?.error || "image service down/slow?"})`,
      );
    } catch (err) {
      console.error(
        `[automation-content] generateImageAndText attempt ${attempt}/${MAX_ATTEMPTS} EXCEPTION:`,
        err.message,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  console.error(
    `[automation-content] generateImageAndText FAILED after ${MAX_ATTEMPTS} attempts — image service unreachable?`,
  );
  // No image means the caller aborts this slot, but hand back whatever text we
  // did manage to write rather than discarding it.
  const ours = await ourCaptionsPromise;
  const text = (ours?.gmb || textFallback).trim();
  return {
    imageUrl: null,
    postText: text,
    descriptions: {
      gmb: text,
      fb: ours?.fb || text,
      ig: ours?.ig || text,
      li: ours?.li || text,
      pin: ours?.pin || text,
      pinTitle: ours?.pinTitle || "",
      yt: ours?.yt || text,
    },
  };
}

/** Backward-compat: image URL only (delegates to the combined generator). */
export async function generateImage({
  imagePrompt,
  keyword,
  businessName,
  imageConfig = {},
}) {
  const { imageUrl } = await generateImageAndText({
    imagePrompt,
    keyword,
    businessName,
    imageConfig,
  });
  return imageUrl;
}

/** Backward-compat: text only. Uses the SAME aiAssetsGenerate webhook. */
export async function generatePostText({
  businessName,
  keyword,
  cityName,
  imagePrompt,
  imageConfig = {},
}) {
  const { postText } = await generateImageAndText({
    imagePrompt,
    keyword,
    businessName,
    cityName,
    imageConfig,
  });
  return postText;
}
