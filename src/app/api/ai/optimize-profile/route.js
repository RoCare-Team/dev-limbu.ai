import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { businessName, description, categories } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured in .env.local' }, { status: 500 });
    }

    const prompt = `Optimize this Google Business Profile:

Business Name: ${businessName || 'Not set'}
Current Description: ${description || 'Not set'}
Current Categories: ${categories?.map(c => c.name || c).join(', ') || 'None'}

Generate:
1. Optimized Business Name (50 chars max, SEO keywords, benefit-focused)
2. Optimized Description (500 chars max, SEO keywords, services, location, unique selling points, call-to-action)
3. 5-8 Suggested Primary/Secondary Categories (relevant to business, exact Google categories)

SEO-focused, local-first, compelling copy. JSON output only:

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
        temperature: 0.3,
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

