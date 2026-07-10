import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import {
  GMB_PROFILE_DESCRIPTION_MAX,
  GMB_PROFILE_DESCRIPTION_MIN,
  clampGmbDescription,
} from '@/lib/gmbConstants';

export const dynamic = 'force-dynamic';

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/**
 * Ensure a GMB description uses nearly the full allowance (740–750 chars). gpt-4o-mini
 * routinely under-writes, so if the draft is short we re-prompt (up to 2 passes) asking
 * it to expand — adding real detail (services, areas served, experience, guarantees) —
 * without padding or repetition. Always clamped to the 750 hard limit at the end.
 */
async function expandToMinDescription(openai, initial, context) {
  let current = clampGmbDescription(String(initial || '').trim());
  for (let attempt = 0; attempt < 2 && current.length < GMB_PROFILE_DESCRIPTION_MIN; attempt += 1) {
    const need = GMB_PROFILE_DESCRIPTION_MIN - current.length;
    const sys =
      'You are a Google Business Profile copywriter. Expand the given description so it uses nearly the full length allowance. Add ONLY accurate, useful detail grounded in the JSON context (services offered, areas served, experience, guarantees, what makes the business trustworthy). Do NOT pad with filler, do NOT repeat sentences, keep it natural and SEO-friendly, keep the soft CTA at the end. Return ONLY the description text, no quotes, no markdown.';
    const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nCurrent description (${current.length} chars):\n${current}\n\nTask: Rewrite it to be between ${GMB_PROFILE_DESCRIPTION_MIN} and ${GMB_PROFILE_DESCRIPTION_MAX - 2} characters (including spaces) — it currently needs about ${need} more characters. ALWAYS finish the final sentence and end on a complete word; never stop mid-word or mid-sentence, and never exceed ${GMB_PROFILE_DESCRIPTION_MAX}. Keep every fact accurate. Return ONLY the description text.`;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const next = clampGmbDescription((completion.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, ''));
      // Keep whichever is longer so we never regress on length.
      if (next.length > current.length) current = next;
      else break;
    } catch {
      break;
    }
  }
  return current;
}

const FIELD_INSTRUCTIONS = {
  businessName:
    'Return a clean professional business name. Use the real business title from context when provided. Return ONLY the name, no quotes.',
  tagline:
    'Write a punchy 8–12 word tagline. Return ONLY the tagline.',
  description:
    `Write a Google Business Profile description: SEO-friendly and accurate to the facts given. When the context provides them, weave in the business category (primaryCategory), the city (city/locality), the address/area, the target keyword(s), and the customer intent (what the searcher wants) naturally — do not list them as labels. Include locality/service areas and end with a soft CTA. LENGTH: write between ${GMB_PROFILE_DESCRIPTION_MIN} and ${GMB_PROFILE_DESCRIPTION_MAX - 2} characters (including spaces) — use nearly the full allowance but ALWAYS finish your final sentence and end on a complete word; never stop mid-word or mid-sentence, and never exceed ${GMB_PROFILE_DESCRIPTION_MAX}. Return ONLY the description text.`,
  services:
    'List exactly 5 concrete services this business offers (from category + context). Return ONLY a JSON array of strings like ["a","b","c","d","e"] — no markdown.',
  phone:
    'Return the phone from context if present; otherwise a placeholder Indian format. Return ONLY the number string.',
  website:
    'Return the website URL from context if present; otherwise suggest one plausible https URL. Return ONLY the URL.',
  bookingUrl:
    'Suggest one short booking or appointment https URL. Return ONLY the URL.',
  serviceArea:
    'Use the dedicated service-area task in the user message (address + radius). Follow that format exactly.',
  hoursSummary:
    'Summarize opening hours in Google Business style from context hoursSummary if present; otherwise infer from category. Plain text only.',
  specialHours:
    'Short notes for holidays/special hours; plain text, one line per item or single paragraph.',
  yearEstablished:
    'Return plausible "Est. YYYY" or four-digit year only.',
  accessibility:
    '3–5 accessibility/amenity labels, comma-separated.',
  additionalInfo:
    'Two short sentences: parking, payments, specialties — grounded in context.',
  primaryCategory:
    'Return the primary Google-style category display name (e.g. "Water Purification Company"). Return ONLY that phrase.',
  chatUrl:
    'WhatsApp or messaging URL if inferable; else NONE. Return ONLY URL or NONE.',
  singleDayHours:
    'Return ONLY compact JSON for ONE weekday (context.targetDay like MONDAY). Use one of: {"closed":true} OR {"open24":true} OR {"open":"HH:MM","close":"HH:MM"} with 24h clock strings, no prose.',
};

function buildFieldUserPrompt(fieldId, fieldLabel, context, currentValue) {
  const base = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\n`;
  const cur =
    currentValue != null && String(currentValue).trim()
      ? `Current field value (improve or replace if needed):\n${String(currentValue).trim()}\n\n`
      : '';
  const instr = FIELD_INSTRUCTIONS[fieldId] || `Generate content for field "${fieldLabel}". Return ONLY the value.`;
  return `${base}${cur}Task: ${instr}`;
}

/** Structured nearby-localities task (matches product spec: address + radius → 5–7 clean area lines). */
function buildServiceAreaUserPrompt(context, currentValue) {
  const ctx = context && typeof context === 'object' ? context : {};
  const address =
    String(ctx.storefrontAddress || ctx.fullAddress || '').trim() ||
    [ctx.locality, ctx.administrativeArea, ctx.regionCode].filter(Boolean).join(', ') ||
    '(infer center from JSON context only)';
  const radiusRaw = Number(ctx.searchRadiusKm);
  const radius = Number.isFinite(radiusRaw) && radiusRaw > 0 ? Math.round(radiusRaw) : 4;
  const lat = ctx.listingLatitude;
  const lng = ctx.listingLongitude;
  const coordLine =
    lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? `\nAnchor coordinates (center point — use these instead of guessing): latitude ${Number(lat).toFixed(5)}, longitude ${Number(lng).toFixed(5)}\n`
      : '\n(No coordinates in context — estimate the center from the address text, then reason about nearby localities.)\n';

  const cur =
    currentValue != null && String(currentValue).trim()
      ? `Already selected by the user (do not repeat these; you may suggest adjacent areas):\n${String(currentValue).trim()}\n\n`
      : '';

  return `${cur}Given a business address: "${address}"
${coordLine}
1. Use the address (and anchor coordinates if given) as the business center.
2. Find nearby areas — localities, neighborhoods, sublocalities only — within ${radius} km of that center. Do not list shops, brands, POIs, or businesses.
3. Return only area / locality names as human-readable lines suitable for Google Business Profile service areas (include city and state/country when it improves clarity).
4. Remove duplicates; keep results clean; prioritize well-known locality names.
5. Return at least 5 and at most 7 distinct suggestions.

Reference JSON (facts only; do not echo keys in the answer):
${JSON.stringify(ctx, null, 2)}

Output format (exactly this style — one area per line, leading hyphen, no extra prose before or after the list):
- Area 1
- Area 2
- Area 3`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openai = getClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { mode = 'field', fieldId, fieldLabel, context, currentValue, omitDescription: omitStudioDescription } = body;

    if (mode === 'foodMenu') {
      // Generate a structured food menu for an eligible (restaurant / sweets / cafe)
      // location: sections, each with items { name, description, price }. The UI lets
      // the user review/edit before it is saved to Google's Food Menu.
      const currency = String(body?.currency || 'INR').trim() || 'INR';
      const sys =
        'You are a menu writer for a Google Business Profile food listing. Use ONLY facts from the JSON context (business name, primary category, city). Return ONLY valid JSON, no markdown.';
      const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nTask: Create a realistic menu for this business based on its primary category and locality. Use 2–4 sections, each with 3–6 items. Each item has a "name", a short "description" (max 120 chars), and a numeric "price" in ${currency} (number only, no symbol). Keep prices realistic for the locality. Return ONLY: {"currency":"${currency}","sections":[{"name":"...","items":[{"name":"...","description":"...","price":0}]}]}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1400,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const text = completion.choices?.[0]?.message?.content?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from model', raw: text.slice(0, 400) }, { status: 502 });
      }
      const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];
      const cleaned = sections
        .map((sec) => ({
          name: String(sec?.name || '').trim().slice(0, 140),
          items: (Array.isArray(sec?.items) ? sec.items : [])
            .map((it) => {
              const price = Number(it?.price);
              return {
                name: String(it?.name || '').trim().slice(0, 140),
                description: String(it?.description || '').trim().slice(0, 300),
                price: Number.isFinite(price) && price >= 0 ? String(price) : '',
              };
            })
            .filter((it) => it.name)
            .slice(0, 30),
        }))
        .filter((sec) => sec.name && sec.items.length)
        .slice(0, 12);
      return NextResponse.json({ success: true, currency: parsed?.currency || currency, sections: cleaned });
    }

    if (mode === 'descriptionVariants') {
      // Generate 2–3 DISTINCT Google Business Profile description options so the user
      // can pick one. Uses the guided inputs (city/address/keyword/intent) + category
      // from the JSON context. Each option is clamped to the Google length limit.
      const count = Math.min(Math.max(Number(body?.count) || 3, 2), 3);
      const sys =
        'You are a Google Business Profile copywriter. Use ONLY facts from the JSON context. Return ONLY valid JSON, no markdown fences.';
      const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nTask: Write ${count} DISTINCT Google Business Profile description options. For each: SEO-friendly and accurate; naturally weave in the business category (primaryCategory), city (city/locality), address/area, target keyword(s) and customer intent when present; end with a soft CTA. Vary the angle/tone across the options so they read differently. LENGTH (strict): each option MUST be between ${GMB_PROFILE_DESCRIPTION_MIN} and ${GMB_PROFILE_DESCRIPTION_MAX - 2} characters (including spaces) — use nearly the full allowance, ALWAYS finish the final sentence and end on a complete word (never stop mid-word or mid-sentence), and never exceed ${GMB_PROFILE_DESCRIPTION_MAX}. Do not return short options. Return ONLY: {"variants":["option 1","option 2"${count === 3 ? ',"option 3"' : ''}]}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.85,
        max_tokens: 1400,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const text = completion.choices?.[0]?.message?.content?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from model', raw: text.slice(0, 400) }, { status: 502 });
      }
      const rawVariants = Array.isArray(parsed?.variants)
        ? parsed.variants
        : Array.isArray(parsed)
          ? parsed
          : [];
      const clamped = rawVariants
        .map((v) => clampGmbDescription(String(v || '').trim()))
        .filter(Boolean)
        .slice(0, 3);
      if (!clamped.length) {
        return NextResponse.json({ error: 'AI returned no descriptions. Try again.' }, { status: 502 });
      }
      // Grow any option that came back short so every variant uses the full 740–750 allowance.
      const variants = await Promise.all(
        clamped.map((v) =>
          v.length < GMB_PROFILE_DESCRIPTION_MIN ? expandToMinDescription(openai, v, context) : Promise.resolve(v)
        )
      );
      return NextResponse.json({ success: true, variants });
    }

    if (mode === 'serviceDescription') {
      // Generate a short description for ONE service, given its title + business context.
      const title = String(body?.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title required for mode=serviceDescription' }, { status: 400 });
      }
      const descCategory =
        String(context?.primaryCategory || (Array.isArray(context?.categoryHints) ? context.categoryHints[0] : '') || '').trim();
      const sys =
        'You are a Google Business Profile services copywriter. Use ONLY facts from the JSON context (business name, category, city). Ground the description in the specific service category provided. Return ONLY the description sentence(s), no quotes, no markdown.';
      const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nService category: "${descCategory || 'the primary category'}"\nService title: "${title}"\n\nTask: Write a concise, benefit-led description for THIS service — 1–2 sentences, max 250 characters, grounded in the category "${descCategory || 'the primary category'}" and the city. No emojis, no quotes. Return ONLY the description text.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const description = (completion.choices?.[0]?.message?.content || '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .slice(0, 300);
      if (!description) {
        return NextResponse.json({ error: 'AI returned no description. Try again.' }, { status: 502 });
      }
      return NextResponse.json({ success: true, description });
    }

    if (mode === 'serviceItems') {
      // Generate concrete services for ONE specific category, each with a title and a
      // short description (Google free-form serviceItems support label descriptions).
      // The category is the focus — the same business has different categories, and each
      // must get DIFFERENT services specific to that category (not generic company-wide ones).
      const targetCategory =
        String(context?.primaryCategory || (Array.isArray(context?.categoryHints) ? context.categoryHints[0] : '') || '').trim();
      const sys =
        'You are a Google Business Profile services copywriter. You generate services for ONE specific business category at a time. The services you return MUST be specific to that exact category — not generic services that apply to the whole business. Use facts from the JSON context (business name, city) for grounding. Return ONLY valid JSON, no markdown.';
      const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nTARGET CATEGORY: "${targetCategory || 'the primary category'}"\n\nTask: List 5 concrete services that specifically belong to the category "${targetCategory || 'the primary category'}". The titles and descriptions MUST be tailored to this exact category and be clearly different from what another category of the same business would offer. Each service has a short "title" (2–5 words, e.g. "RO Water Purifier Installation") and a "description" (1–2 sentences, max 250 characters, what it includes / benefit). Do NOT repeat generic services — make them distinctive to "${targetCategory || 'this category'}". Return ONLY: {"items":[{"title":"...","description":"..."}]}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const text = completion.choices?.[0]?.message?.content?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from model', raw: text.slice(0, 400) }, { status: 502 });
      }
      const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
      const cleaned = items
        .map((it) => ({
          title: String(it?.title || it?.name || '').trim().slice(0, 140),
          description: String(it?.description || '').trim().slice(0, 300),
        }))
        .filter((it) => it.title)
        .slice(0, 20);
      return NextResponse.json({ success: true, items: cleaned });
    }

    if (mode === 'studio') {
      const sys =
        'You are a Google Business Profile copywriter. Use ONLY facts from the JSON context. Return ONLY valid JSON, no markdown fences.';
      const user = omitStudioDescription
        ? `Context:\n${JSON.stringify(context || {}, null, 2)}\n\nReturn ONLY this JSON shape (no description key):\n{"tagline":"8-12 words","services":["s1","s2","s3","s4","s5"]}`
        : `Context:\n${JSON.stringify(context || {}, null, 2)}\n\nReturn ONLY this JSON shape:\n{"description":"max ${GMB_PROFILE_DESCRIPTION_MAX} characters, SEO + CTA","tagline":"8-12 words","services":["s1","s2","s3","s4","s5"]}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.75,
        max_tokens: omitStudioDescription ? 800 : 1200,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      const text = completion.choices?.[0]?.message?.content?.trim() || '';
      let parsed;
      try {
        parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from model', raw: text.slice(0, 400) }, { status: 502 });
      }
      if (omitStudioDescription) {
        delete parsed.description;
      } else if (typeof parsed.description === 'string') {
        parsed.description = clampGmbDescription(parsed.description);
      }
      return NextResponse.json({ success: true, studio: parsed });
    }

    if (!fieldId) {
      return NextResponse.json({ error: 'fieldId required for mode=field' }, { status: 400 });
    }

    const userPrompt =
      fieldId === 'serviceArea'
        ? buildServiceAreaUserPrompt(context, currentValue)
        : buildFieldUserPrompt(fieldId, fieldLabel || fieldId, context, currentValue);

    const systemContent =
      fieldId === 'serviceArea'
        ? 'You suggest Google Business Profile service-area locality lines. Follow the user task exactly. Output ONLY the hyphen bullet list (5–7 lines). No preamble, no markdown fences, no numbering other than the hyphen bullets shown in the example.'
        : 'You optimize Google Business Profile fields. Follow the user task exactly. No preamble, no markdown unless JSON array was requested.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: fieldId === 'description' ? 900 : fieldId === 'serviceArea' ? 450 : 500,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        { role: 'user', content: userPrompt },
      ],
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || '';
    if (fieldId === 'description') {
      text = clampGmbDescription(text);
      // Grow short drafts so the description uses the full 740–750 allowance.
      if (text.length < GMB_PROFILE_DESCRIPTION_MIN) {
        text = await expandToMinDescription(openai, text, context);
      }
    }

    if (fieldId === 'services') {
      try {
        const arr = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
        return NextResponse.json({ success: true, value: arr });
      } catch {
        return NextResponse.json({ success: true, value: text });
      }
    }

    return NextResponse.json({ success: true, value: text });
  } catch (e) {
    console.error('[business-optimization-ai]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
