/**
 * Shared GPT + /api/aiAssetsGenerate helpers for automation cron
 * (prefetch in auto-post + inline fallback in automation-plans publish).
 */

import { normalizePlatformDescriptions } from "@/utils/aiPostDescriptions";

export function getAutomationCronBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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
        // Guarantees valid JSON — no more silent fallback when GPT returns
        // chatty / fenced output that JSON.parse can't handle.
        response_format: { type: "json_object" },
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

/** Convert a stored asset (raw base64 / data URL / http URL) into an OpenAI image_url value. */
function toOpenAiImageUrl(s) {
  if (typeof s !== "string" || !s.trim()) return null;
  const v = s.trim();
  if (v.startsWith("data:image") || /^https?:\/\//i.test(v)) return v;
  // raw base64 — sniff the mime from the first bytes
  const mime = v.startsWith("iVBOR")
    ? "image/png"
    : v.startsWith("R0lGOD")
      ? "image/gif"
      : v.startsWith("UklGR")
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${v}`;
}

/**
 * Vision-analyse the plan's REAL assets (product / character / uniform /
 * background / logo) with gpt-4o-mini in ONE cheap call (detail:"low"), so the
 * image prompt is written AROUND what we actually have instead of GPT guessing
 * blindly. Returns e.g. { product, character, uniform, background, logoColours }
 * with one dense line each — or {} when there are no assets or analysis fails
 * (never blocks the post; prompt generation simply proceeds without asset
 * context, exactly like before).
 */
export async function analyzeAssets(imageConfig = {}) {
  const cfg = applyIncludeInGeneration(imageConfig);
  const slots = [
    [
      "product",
      cfg.productImage,
      "what EXACTLY it is, its use, shape, key colours, material / texture, premium cues",
    ],
    [
      "character",
      cfg.characterImage,
      "apparent age range, gender presentation, attire, hairstyle, overall vibe",
    ],
    [
      "uniform",
      cfg.uniformImage,
      "the profession it suggests, its colours and style details",
    ],
    [
      "background",
      cfg.backgroundImage,
      "location type, key visible elements, colours, mood",
    ],
    [
      "logoColours",
      cfg.logoImage,
      "dominant brand colours and logo style ONLY, two short phrases",
    ],
  ];
  const present = slots
    .map(([key, img, instr]) => [key, toOpenAiImageUrl(img), instr])
    .filter(([, url]) => url);
  if (!present.length) return {};

  const content = [
    {
      type: "text",
      text: `Analyse each labelled ad-asset image below. For every label write ONE dense line (15-30 words) covering exactly what its instruction asks. Return ONLY minified JSON with exactly these keys: {${present.map(([k]) => `"${k}":"..."`).join(",")}}`,
    },
  ];
  for (const [key, url, instr] of present) {
    content.push({ type: "text", text: `${key} — ${instr}:` });
    content.push({ type: "image_url", image_url: { url, detail: "low" } });
  }

  const result = await callGpt(
    "You are a precise visual analyst inside an ad-creative pipeline. You describe assets exactly as they are, in dense, art-director-useful detail. Return ONLY compact minified JSON, no markdown, no commentary.",
    content,
    400,
  );
  if (!result || typeof result !== "object") return {};
  console.log("[automation-content] Asset analysis:", result);
  return result;
}

// ASSET-AWARE + scroll-stopping. Real assets are vision-analysed first and the
// prompt is built AROUND them: the exact product becomes the hero, the exact
// character / uniform / background shape the scene, and the backdrop colour-pop
// complements the logo's brand colours. Every image still carries exactly ONE
// dramatic "wow" element + bold colour pop + dramatic lighting, in pure positive
// wording (negations like "no text" often make models ADD text).
export async function generateImagePrompt({
  keyword,
  businessName,
  cityName,
  imageConfig = {},
}) {
  const assets = await analyzeAssets(imageConfig);
  const assetLines = [];
  if (assets.product)
    assetLines.push(
      `- PRODUCT (real image, composited into the creative): ${assets.product} → this EXACT product IS the hero subject; describe it faithfully and stage the whole scene to flatter it.`,
    );
  if (assets.character)
    assetLines.push(
      `- CHARACTER (real person image): ${assets.character} → this EXACT person appears in the scene; match their look and attire, and give them the emotion from layer 4.`,
    );
  if (assets.uniform)
    assetLines.push(
      `- UNIFORM (real image): ${assets.uniform} → any person shown wears this uniform; the scene must fit this profession.`,
    );
  if (assets.background)
    assetLines.push(
      `- BACKGROUND (real image): ${assets.background} → set the scene INSIDE this exact environment and extend it naturally; the colour-pop must harmonise with it.`,
    );
  if (assets.logoColours)
    assetLines.push(
      `- BRAND COLOURS (from the logo): ${assets.logoColours} → choose the backdrop colour-pop and grade to complement these brand colours.`,
    );
  const assetBlock = assetLines.length
    ? `
REAL ASSETS PROVIDED (the ad engine will place these exact images into the final creative — build the scene around them so everything matches seamlessly):
${assetLines.join("\n")}
`
    : "";

  const fallback = `Cinematic hero advertising photograph of ${keyword} at ${businessName}${cityName ? " in " + cityName : ""}, India, the hero subject dominating the frame, dramatic golden rim light with glowing light rays and fine particles suspended in the air around it, a bold deep-teal complementary backdrop making the subject pop off the screen, shot on Sony A7R V with an 85mm f/1.4 lens at a slight low hero angle, shallow depth of field with creamy bokeh, vivid punchy colour grade with deep contrast, subject filling the lower two thirds of the vertical frame, the entire top third a clean softly glowing gradient reserved for branding overlay, award-winning scroll-stopping commercial advertising photography, hyper-realistic, tack-sharp focus on the subject, 8K detail`;
  const cityLine = cityName ? `City / locality  : "${cityName}", India` : "";
  const result = await callGpt(
    [
      "You are an elite, award-winning advertising photographer and art director whose campaign images go viral — people stop scrolling the instant they see them.",
      "You write prompts for state-of-the-art text-to-image models that produce dramatic, cinematic, scroll-stopping ad photographs for premium Indian brands — bold and eye-catching, yet always looking like a REAL photograph, never CGI, never illustration, never 'AI-looking'.",
      "You know thumb-stopping impact comes from: one larger-than-life hero subject, exactly ONE dramatic wow element (frozen motion, splash, floating elements, glow), a bold complementary colour pop, dramatic lighting, and hyper-real micro-textures.",
      "You describe only what IS in the frame and never use negative phrasing.",
      "Return ONLY compact minified JSON, no markdown, no commentary.",
    ].join(" "),
    `Business         : "${businessName}"
Offer / keyword  : "${keyword}"
${cityLine}
${assetBlock}
TASK: Write ONE high-impact, scroll-stopping prompt (100-140 words, a single flowing paragraph) for a premium vertical portrait (1080x1350) social + Google Business ad photo that makes people STOP scrolling and instantly desire "${keyword}".

Layer the paragraph in exactly this order:
1. HERO SUBJECT — the single most relevant product / service / person for "${keyword}", filling the frame like a movie-poster hero. Add 2-3 hyper-real micro-details: glistening surface, rising steam, condensation droplets, fabric weave, natural skin with visible pores, sparkling reflections — whichever genuinely fits.
2. WOW FACTOR — exactly ONE dramatic scroll-stopper that fits this business: a frozen-motion splash or pour, fresh ingredients or product elements suspended mid-air, a soft burst of steam or aromatic smoke, golden light rays cutting through fine floating particles, water droplets frozen by high-speed flash, warm sparks or glowing bokeh lights behind the subject, or a mirror-like dramatic reflection. Pick the one with maximum drama for "${keyword}".
3. SCENE & COLOUR POP — a clean cinematic backdrop in ONE bold complementary colour that makes the subject explode off the screen (deep teal behind warm food, rich burgundy behind gold jewellery, charcoal behind glowing services, emerald behind warm skin tones)${cityName ? `, with a subtle ${cityName} touch where natural` : ""}, with gentle depth and atmosphere.
4. EMOTION — if a person appears: genuine delight, excitement or confident pride, eyes engaging the camera; realistic modern Indian people, dignified, natural relaxed hands.
5. CAMERA — a real camera + lens + aperture (e.g. "shot on Sony A7R V, 85mm f/1.4" or "Canon EOS R5, 50mm f/1.8"), slight low hero angle or dramatic close-up, shallow depth of field, creamy bokeh; add "high-speed flash freeze" whenever motion appears.
6. LIGHT & GRADE — dramatic lighting: strong golden rim light, a glowing edge light, or a cinematic spotlight with soft fill; then ONE punchy grade: "vivid high-contrast commercial grade", "warm golden cinematic grade" or "bold saturated editorial grade".
7. IMPACT TAGS — end the paragraph with: "award-winning scroll-stopping commercial advertising photography, cinematic hero shot, vivid punchy colours, dramatic lighting, hyper-realistic, natural imperfections, tack-sharp focus on the subject, 8K detail".
8. COMPOSITION — the subject fills the lower two thirds of the vertical frame; the entire top third stays a clean, softly glowing, uncluttered gradient or plain area reserved for branding overlay.

HARD RULES:
- Pure positive description only. Never use the words "no", "not", "without", "avoid", "text", "logo", "watermark", "cartoon" or "3D" — keep every surface plain and unmarked by describing it that way.
- Exactly ONE hero subject, ONE scene, ONE wow-factor element — bold and dramatic, never cluttered or chaotic.
- Strictly photographic and believable: dramatic, yet something a real advertising photographer could actually shoot in a studio or on location.
- When REAL ASSETS are listed above, describe those EXACT items — the exact product, person, uniform and environment shown — never invent a different product, person or setting in their place.

Return ONLY: {"prompt":"..."}`,
    500,
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
  platforms,
} = {}) {
  const BASE_URL = getAutomationCronBaseUrl();
  const cfg = applyIncludeInGeneration(imageConfig);
  const cleanB64 = (s) =>
    typeof s === "string" && s.startsWith("data:image")
      ? s.split(",")[1]
      : s || "";

  const textFallback = `${keyword} | ${businessName}${cityName ? " — " + cityName : ""}`;

  // Always ask the webhook for EVERY platform's caption in one shot so gmb/fb/ig/
  // pinterest each get their OWN distinct text — never a reused GMB caption. We
  // request the full set regardless of which platforms the plan posts to; unused
  // fields are simply ignored, but the ones we publish are always platform-native.
  const requested = ["gmb", "fb", "ig", "pinterest"];

  const payload = {
    topic: imagePrompt || keyword || "",
    bussiness_name: businessName || "",
    keywords: keyword || "",
    colourPalette: cfg.colourPalette || "",
    size: cfg.size || "4:3",
    characterImage: cleanB64(cfg.characterImage),
    uniformImage: cleanB64(cfg.uniformImage),
    productImage: cleanB64(cfg.productImage),
    backgroundImage: cleanB64(cfg.backgroundImage),
    logoImage: cleanB64(cfg.logoImage),
    // Logo is always composited unchanged in the top-right corner.
    logoPosition: "top-right",
    platform: requested.join(","),
    // "manual" mode: the `topic` we send is already a complete, GPT-crafted image
    // prompt (see generateImagePrompt) — "manual" tells the n8n workflow to use it
    // as-is instead of re-expanding/rewriting it the way "ai" mode would.
    mode: "manual",
  };

  console.log(
    "[automation-content] aiAssetsGenerate —",
    `${BASE_URL}/api/aiAssetsGenerate`,
  );

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
        const postText =
          gmb || (norm.fb_des || norm.ig_des || "").trim() || textFallback;
        // Each platform keeps its own caption; fall back to the GMB text only when
        // that platform's caption is missing so no field is ever empty.
        const descriptions = {
          gmb: postText,
          fb: (norm.fb_des || "").trim() || postText,
          ig: (norm.ig_des || "").trim() || postText,
          li: (norm.li_des || "").trim() || postText,
          pin: (norm.pin_des || "").trim() || postText,
          pinTitle: (norm.pin_title || "").trim(),
          yt: (norm.yt_des || "").trim() || postText,
        };
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
  return {
    imageUrl: null,
    postText: textFallback,
    descriptions: {
      gmb: textFallback,
      fb: textFallback,
      ig: textFallback,
      li: textFallback,
      pin: textFallback,
      pinTitle: "",
      yt: textFallback,
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
