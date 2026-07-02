/**
 * Shared GPT + /api/aiAssetsGenerate helpers for automation cron
 * (prefetch in auto-post + inline fallback in automation-plans publish).
 */

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
    'You are a creative director for an AI image generation tool. Return ONLY compact JSON.',
    `Business: "${businessName}"
Keyword: "${keyword}"
Create a vivid, specific image-generation prompt (max 120 chars) for a professional GMB post image.
Return ONLY: {"prompt":"..."}`,
    200
  );
  const prompt = result?.prompt || fallback;
  console.log('[automation-content] Image prompt:', prompt);
  return prompt;
}

export async function generateImage({ imagePrompt, keyword, businessName, imageConfig = {} }) {
  const BASE_URL = getAutomationCronBaseUrl();
  const cfg = applyIncludeInGeneration(imageConfig);
  const cleanB64 = (s) =>
    typeof s === 'string' && s.startsWith('data:image') ? s.split(',')[1] : s || '';

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
    platform: 'gmb',
  };

  console.log('[automation-content] aiAssetsGenerate —', `${BASE_URL}/api/aiAssetsGenerate`);

  // Retry a few times: the upstream image service (assets-image.limbutech.in) can
  // be briefly unreachable / slow. Without retries a single blip drops the whole
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
        console.log('[automation-content] Extracted imageUrl:', imageUrl);
        return imageUrl;
      }
      console.warn(
        `[automation-content] attempt ${attempt}/${MAX_ATTEMPTS} returned no imageUrl (status ${res.status}, ${json?.error || 'image service down/slow?'})`
      );
    } catch (err) {
      console.error(`[automation-content] generateImage attempt ${attempt}/${MAX_ATTEMPTS} EXCEPTION:`, err.message);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  console.error(`[automation-content] generateImage FAILED after ${MAX_ATTEMPTS} attempts — image service unreachable?`);
  return null;
}

export async function generatePostText({ businessName, keyword, cityName }) {
  const fallback = `${keyword} | ${businessName}${cityName ? ' — ' + cityName : ''}`;
  const result = await callGpt(
    'Expert GMB copywriter. Respond with ONLY compact JSON.',
    `Write a Google My Business post for:
Business: "${businessName}"
Keyword: "${keyword}"
City: "${cityName || ''}"
Rules: max 150 chars total, use actual city name (never {{city}}), energetic, 1-2 emojis, 2-3 hashtags.
Return ONLY: {"text":"...","hashtags":["#a","#b"]}`,
    300
  );

  if (!result?.text) return fallback;
  const hashtags = Array.isArray(result.hashtags) ? result.hashtags : [];
  const postText = `${result.text} ${hashtags.join(' ')}`.trim();
  console.log('[automation-content] Post text:', postText);
  return postText;
}
