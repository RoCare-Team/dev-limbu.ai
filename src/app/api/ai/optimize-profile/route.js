import { NextResponse } from 'next/server';
import { HOUSE_STYLE, shortBusinessName } from '@/lib/contentStyleRules';

export async function POST(request) {
  try {
    const { businessName, description, categories } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured in .env.local' }, { status: 500 });
    }

    const prompt = `Optimize this Google Business Profile.

Business Name: ${businessName || 'Not set'}
Short form to use in prose: ${shortBusinessName(businessName) || 'the business'}
Current Description: ${description || 'Not set'}
Current Categories: ${categories?.map(c => c.name || c).join(', ') || 'None'}

Produce three things:

1. optimizedBusinessName — 50 characters max. Google's own guidelines forbid
   stuffing keywords or taglines into the name, and a stuffed name risks
   suspension. So return the REAL business name, cleaned up: correct
   capitalisation, no ALL CAPS, no keyword list, no city appended unless it is
   genuinely part of the registered name.

2. optimizedDescription — 500 characters max. Open with what the business does
   and who it serves. Name the actual services. Mention the locality once,
   naturally. End with one plain invitation. Keep every fact from the current
   description; improve only the wording.

3. suggestedCategories — 5 to 8 real Google Business Profile category names
   (exactly as Google words them, e.g. "Dental clinic", "Water purification
   company"). Order them most relevant first; the first one is the primary.
   Only categories that genuinely describe this business — a wrong category
   hurts ranking more than a missing one.

${HOUSE_STYLE}

JSON output only:

{
  "optimizedBusinessName": "...",
  "optimizedDescription": "...",
  "suggestedCategories": ["Category1", "Category2", ...]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.4,
        // The response is JSON.parse'd below; without this a stray markdown
        // fence or a leading sentence takes the whole request down.
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const optimized = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({ success: true, data: optimized });
  } catch (error) {
    console.error('AI Optimize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

