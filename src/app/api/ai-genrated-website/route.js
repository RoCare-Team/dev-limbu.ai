import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const {
      title,
      locality,
      primaryCategory,
      additionalCategories = [],
    } = await req.json();

    if (!title || !primaryCategory) {
      return Response.json(
        { error: "Missing business data" },
        { status: 400 }
      );
    }

    const prompt = `
Create a COMPLETE professional business website landing page in JSON format.

Business Name: ${title}
Location: ${locality}
Primary Category: ${primaryCategory}
Additional Categories: ${additionalCategories.join(", ")}

Return ONLY valid JSON with this structure:

{
  "theme": {
    "primaryColor": "",
    "secondaryColor": "",
    "font": ""
  },
  "hero": {
    "headline": "",
    "subheadline": "",
    "ctaPrimary": "",
    "ctaSecondary": "",
    "backgroundImageKeyword": ""
  },
  "about": {
    "title": "",
    "content": ""
  },
  "services": [
    {
      "title": "",
      "description": "",
      "iconKeyword": ""
    }
  ],
  "features": [
    "",
    "",
    ""
  ],
  "whyChooseUs": [
    "",
    "",
    ""
  ],
  "testimonials": [
    {
      "name": "",
      "review": ""
    }
  ],
  "faq": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "ctaSection": {
    "headline": "",
    "subheadline": "",
    "buttonText": ""
  },
  "meta": {
    "title": "",
    "description": ""
  }
}

Make it highly professional, SEO optimized, modern and premium.
Do not add explanations.
Only return valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior website copywriter and conversion expert. Return valid structured JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 1500,
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("AI JSON Parse Error:", raw);
      return Response.json(
        { error: "Invalid AI JSON format" },
        { status: 500 }
      );
    }

    return Response.json({ content: parsed });

  } catch (err) {
    console.error("AI Website Generation Error:", err);
    return Response.json(
      { error: "AI website generation failed" },
      { status: 500 }
    );
  }
}
