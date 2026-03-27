import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI is not configured (OPENAI_API_KEY).' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      businessName = '',
      address = '',
      locality = '',
      website = '',
      phone = '',
      categories = [],
      existingDescription = '',
    } = body;

    const catStr = Array.isArray(categories) ? categories.filter(Boolean).join(', ') : String(categories || '');

    const system =
      'You write concise, trustworthy Google Business Profile descriptions. Output plain text only, no markdown, no quotes.';

    const userPrompt = `Write a compelling "Business description" for Google Business Profile.

Business name: ${businessName || 'Unknown'}
${locality || address ? `Location: ${[address, locality].filter(Boolean).join(', ')}` : ''}
${website ? `Website: ${website}` : ''}
${phone ? `Phone: ${phone}` : ''}
${catStr ? `Categories / services: ${catStr}` : ''}
${existingDescription ? `Current description to improve or replace (keep facts, improve wording):\n${existingDescription}` : ''}

Rules:
- 400–750 characters.
- Lead with what the business does and who it serves.
- Mention location or area naturally if provided.
- Professional, friendly tone; 1–2 short paragraphs max.
- No hashtags unless essential; no "As an AI".`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[generate-business-description]', data);
      return NextResponse.json(
        { error: data.error?.message || 'OpenAI request failed' },
        { status: 502 }
      );
    }

    const text = data.choices?.[0]?.message?.content?.trim() || '';
    if (!text) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    return NextResponse.json({ success: true, description: text });
  } catch (e) {
    console.error('[generate-business-description]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
