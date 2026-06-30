import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { GMB_PROFILE_DESCRIPTION_MAX, clampGmbDescription } from '@/lib/gmbConstants';

export const dynamic = 'force-dynamic';

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const FIELD_INSTRUCTIONS = {
  businessName:
    'Return a clean professional business name. Use the real business title from context when provided. Return ONLY the name, no quotes.',
  tagline:
    'Write a punchy 8–12 word tagline. Return ONLY the tagline.',
  description:
    `Write a Google Business Profile description: SEO-friendly, accurate to the facts given, include locality/service areas, end with a soft CTA. HARD LIMIT: maximum ${GMB_PROFILE_DESCRIPTION_MAX} characters (including spaces). Stay under the limit. Return ONLY the description text.`,
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

    if (mode === 'serviceItems') {
      // Generate concrete services for the primary category, each with a title and a
      // short description (Google free-form serviceItems support label descriptions).
      const sys =
        'You are a Google Business Profile services copywriter. Use ONLY facts from the JSON context (business name, primary category, city). Return ONLY valid JSON, no markdown.';
      const user = `Business facts (JSON):\n${JSON.stringify(context || {}, null, 0)}\n\nTask: List 5 concrete services this business offers, grounded in its primary category. Each service has a short "title" (2–5 words, e.g. "RO Water Purifier Installation") and a "description" (1–2 sentences, max 250 characters, what it includes / benefit). Return ONLY: {"items":[{"title":"...","description":"..."}]}`;

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
