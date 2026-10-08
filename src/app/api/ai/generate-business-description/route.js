import { NextResponse } from 'next/server';
import { getGmbSession } from '@/lib/gmbSession';
import { HOUSE_STYLE, shortBusinessName, findBannedPhrases } from '@/lib/contentStyleRules';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getGmbSession(request);
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
      'You write Google Business Profile descriptions for Indian local businesses. You write like the owner, not like a brochure. Output plain text only, no markdown, no quotes.';

    const userPrompt = `Write the "Business description" for this Google Business Profile.

Business name: ${businessName || 'Unknown'}
Use this short form of the name in the text: ${shortBusinessName(businessName) || 'the business'}
${locality || address ? `Location: ${[address, locality].filter(Boolean).join(', ')}` : ''}
${website ? `Website: ${website}` : ''}
${phone ? `Phone: ${phone}` : ''}
${catStr ? `Categories / services: ${catStr}` : ''}
${existingDescription ? `Current description — keep every fact, improve the wording:\n${existingDescription}` : ''}

FORMAT
- 400–750 characters, 1–2 short paragraphs. Always finish the final sentence.
- First sentence: what the business does and who it is for. No preamble.
- Then the specific services, named from the list above rather than summarised.
- Mention the locality once, naturally, where a local would mention it.
- End with one plain, practical invitation (call, visit, book) — no slogan.
- No hashtags. No markdown. No quotes around the text.

${HOUSE_STYLE}`;

    const ask = async (messages) => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[generate-business-description]', data);
        throw new Error(data.error?.message || 'OpenAI request failed');
      }
      return data.choices?.[0]?.message?.content?.trim() || '';
    };

    let text = await ask([
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ]);

    if (!text) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    // The rules are also checked in code: a prompt ban alone still let
    // "Whether you're" through in testing. One repair pass, and only accepted
    // if it actually removed the phrases.
    const offenders = findBannedPhrases(text);
    if (offenders.length) {
      console.log('[generate-business-description] repairing:', offenders.join(', '));
      try {
        const repaired = await ask([
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: text },
          {
            role: 'user',
            content: `That draft used phrases that are not allowed: ${offenders.join(', ')}. Rewrite it without them. Change only the sentences containing those phrases, keep every fact and keep the length in range. Return ONLY the description text.`,
          },
        ]);
        if (repaired && findBannedPhrases(repaired).length === 0) text = repaired;
      } catch (repairErr) {
        // A failed repair is not a failed request — return the usable draft.
        console.error('[generate-business-description] repair failed:', repairErr.message);
      }
    }

    return NextResponse.json({ success: true, description: text });
  } catch (e) {
    console.error('[generate-business-description]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
