import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { business, primaryCategory, additionalCategories } = await req.json();

    if (!business || !primaryCategory) {
      return Response.json(
        { error: "Missing business or category info" },
        { status: 400 }
      );
    }

    const categoryText = additionalCategories?.length
      ? `${primaryCategory}, ${additionalCategories.join(", ")}`
      : primaryCategory;

    const prompt = `
Generate 5 completely different, highly positive, attractive and natural-sounding Google reviews.

Business Name: ${business}
Business Category: ${categoryText}

Rules:
- All reviews must be 100% positive.
- Each review must sound like written by a real customer.
- Each review must be different in tone and structure.
- Mention services or qualities relevant to the category.
- Keep each review between 60–100 words.
- Avoid generic lines like "Highly recommended" only — add real experience.
- Make it emotionally engaging and believable.
- Do NOT repeat phrases across reviews.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a real, satisfied customer writing detailed and engaging Google reviews.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.9,
    });

    const text = completion.choices[0].message.content;

    // Split reviews cleanly (assuming model separates with line breaks)
    const reviews = text
      .split("\n")
      .filter((r) => r.trim().length > 30);

    return Response.json({ reviews });

  } catch (err) {
    console.error("OpenAI Review Error:", err);
    return Response.json(
      { error: "Failed to generate review" },
      { status: 500 }
    );
  }
}