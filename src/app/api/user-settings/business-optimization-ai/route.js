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
    'List cities/areas served (from context serviceAreas/hours/locality). Comma-separated, plain text only.',
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

    const userPrompt = buildFieldUserPrompt(
      fieldId,
      fieldLabel || fieldId,
      context,
      currentValue
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: fieldId === 'description' ? 900 : 500,
      messages: [
        {
          role: 'system',
          content:
            'You optimize Google Business Profile fields. Follow the user task exactly. No preamble, no markdown unless JSON array was requested.',
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
