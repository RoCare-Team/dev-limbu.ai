/**
 * Shared GPT + /api/aiAssetsGenerate helpers for automation cron
 * (prefetch in auto-post + inline fallback in automation-plans publish).
 */

import { normalizePlatformDescriptions } from '@/utils/aiPostDescriptions';

export function getAutomationCronBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/** Strip disabled asset slots before calling aiAssetsGenerate */
export function applyIncludeInGeneration(imageConfig = {}) {
  const inc = imageConfig.includeInGeneration || {};
  const next = { ...imageConfig };
  for (const k of ['characterImage', 'uniformImage', 'productImage', 'backgroundImage', 'logoImage']) {
    if (inc[k] === false) next[k] = null;
  }
  return next;
}

async function callGpt(systemPrompt, userPrompt, maxTokens = 400) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[automation-content] OPENAI_API_KEY not set — GPT call skipped');
    return null;
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('[automation-content] GPT raw:', raw.slice(0, 250));
    return JSON.parse(raw.replace(/^```(?:json)?|```$/gm, '').trim());
  } catch (err) {
    console.error('[automation-content] GPT error:', err.message);
    return null;
  }
}

export async function generateImagePrompt({ keyword, businessName, cityName }) {
  const fallback = `${keyword} — ${businessName}${cityName ? ', ' + cityName : ''}`;
  const result = await callGpt(
    'You are an award-winning advertising art director writing prompts for a text-to-image model that produces 3:4 social-media ad creatives. Return ONLY compact minified JSON, no markdown, no commentary.',
    `Business name: "${businessName}"
Primary keyword / offer: "${keyword}"${cityName ? `\nCity / locality: "${cityName}"` : ''}

Write ONE vivid, camera-ready image prompt for a professional, scroll-stopping Google Business + social post that visually sells "${keyword}".

Requirements:
- Describe a real photographic scene: subject, setting, action, and mood.
- Specify photography craft: camera angle/lens, natural lighting, depth of field, and colour mood.
- Keep it brand-safe, modern, premium${cityName ? ` and locally relevant to ${cityName}, India` : ''}.
- Absolutely NO text, letters, words, captions, watermarks, logos or UI in the image (text and logo are composited later).
- 30-60 words, a single flowing paragraph.

Return ONLY: {"prompt":"..."}`,
    300
  );
  const prompt = result?.prompt || fallback;
  console.log('[automation-content] Image prompt:', prompt);
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
export async function generateImageAndText({ imagePrompt, keyword, businessName, cityName, imageConfig = {}, platforms } = {}) {
  const BASE_URL = getAutomationCronBaseUrl();
  const cfg = applyIncludeInGeneration(imageConfig);
  const cleanB64 = (s) =>
    typeof s === 'string' && s.startsWith('data:image') ? s.split(',')[1] : s || '';

  const textFallback = `${keyword} | ${businessName}${cityName ? ' — ' + cityName : ''}`;

  // Always ask the webhook for EVERY platform's caption in one shot so gmb/fb/ig/
  // pinterest each get their OWN distinct text — never a reused GMB caption. We
  // request the full set regardless of which platforms the plan posts to; unused
  // fields are simply ignored, but the ones we publish are always platform-native.
  const requested = ['gmb', 'fb', 'ig', 'pinterest'];

  const payload = {
    topic: imagePrompt || keyword || '',
    bussiness_name: businessName || '',
    keywords: keyword || '',
    colourPalette: cfg.colourPalette || '',
    size: cfg.size || '3:4',
    characterImage: cleanB64(cfg.characterImage),
    uniformImage: cleanB64(cfg.uniformImage),
    productImage: cleanB64(cfg.productImage),
    backgroundImage: cleanB64(cfg.backgroundImage),
    logoImage: cleanB64(cfg.logoImage),
    platform: requested.join(','),
    mode: 'ai',
  };

  console.log('[automation-content] aiAssetsGenerate —', `${BASE_URL}/api/aiAssetsGenerate`);

  // Retry a few times: the upstream service (assets-image.limbutech.in) can be
  // briefly unreachable / slow. Without retries a single blip drops the whole
  // day's post (imageUrl null → empty-bundle safety gate aborts it).
  const MAX_ATTEMPTS = Math.max(1, Number(process.env.AUTOMATION_IMAGE_RETRIES) || 3);
  const RETRY_DELAY_MS = Math.max(1000, Number(process.env.AUTOMATION_IMAGE_RETRY_DELAY_MS) || 5000);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/aiAssetsGenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log(`[automation-content] aiAssetsGenerate HTTP status (attempt ${attempt}/${MAX_ATTEMPTS}):`, res.status);

      const json = await res.json();
      const d = json?.data;
      const imageUrl =
        d?.imageUrl ||
        d?.url ||
        d?.image ||
        d?.output ||
        (Array.isArray(d) ? d[0]?.imageUrl || d[0]?.url || d[0]?.image : null) ||
        null;

      if (imageUrl) {
        // Same response also carries DISTINCT per-platform captions — extract with
        // the SAME normalizer post-management uses.
        const norm = normalizePlatformDescriptions({ ...json, ...d });
        const gmb = (norm.gmb_des || d?.description || '').trim();
        const postText = gmb || (norm.fb_des || norm.ig_des || '').trim() || textFallback;
        // Each platform keeps its own caption; fall back to the GMB text only when
        // that platform's caption is missing so no field is ever empty.
        const descriptions = {
          gmb: postText,
          fb: (norm.fb_des || '').trim() || postText,
          ig: (norm.ig_des || '').trim() || postText,
          pin: (norm.pin_des || '').trim() || postText,
          pinTitle: (norm.pin_title || '').trim(),
          yt: (norm.yt_des || '').trim() || postText,
        };
        // NOTE: Keep any {city} placeholder INTACT here. The gmb-post upstream
        // (via /api/gmb/publish) replaces {city} per location using each
        // location's cityName, so a single generated caption serves all
        // locations with the correct city. Do NOT substitute at generation time.
        console.log('[automation-content] Extracted imageUrl:', imageUrl);
        console.log('[automation-content] Per-platform text:', {
          gmb: descriptions.gmb.slice(0, 40),
          fb: descriptions.fb.slice(0, 40),
          ig: descriptions.ig.slice(0, 40),
          pin: descriptions.pin.slice(0, 40),
        });
        return { imageUrl, postText, descriptions };
      }
      console.warn(
        `[automation-content] attempt ${attempt}/${MAX_ATTEMPTS} returned no imageUrl (status ${res.status}, ${json?.error || 'image service down/slow?'})`
      );
    } catch (err) {
      console.error(`[automation-content] generateImageAndText attempt ${attempt}/${MAX_ATTEMPTS} EXCEPTION:`, err.message);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  console.error(`[automation-content] generateImageAndText FAILED after ${MAX_ATTEMPTS} attempts — image service unreachable?`);
  return {
    imageUrl: null,
    postText: textFallback,
    descriptions: { gmb: textFallback, fb: textFallback, ig: textFallback, pin: textFallback, pinTitle: '', yt: textFallback },
  };
}

/** Backward-compat: image URL only (delegates to the combined generator). */
export async function generateImage({ imagePrompt, keyword, businessName, imageConfig = {} }) {
  const { imageUrl } = await generateImageAndText({ imagePrompt, keyword, businessName, imageConfig });
  return imageUrl;
}

/** Backward-compat: text only. Uses the SAME aiAssetsGenerate webhook. */
export async function generatePostText({ businessName, keyword, cityName, imagePrompt, imageConfig = {} }) {
  const { postText } = await generateImageAndText({ imagePrompt, keyword, businessName, cityName, imageConfig });
  return postText;
}
