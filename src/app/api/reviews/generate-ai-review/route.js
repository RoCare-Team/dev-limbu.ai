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
Generate 5 completely different Google reviews.

Business Name: ${business}
Business Category: ${categoryText}

Instructions:

- All reviews must be 100% positive.
- Use very simple and clear English.
- Do NOT use any negative-sounding phrases.
- Do NOT use phrases like "couldn’t be happier", "no complaints", "nothing bad", or any double-negative wording.
- Each review must sound like written by a real happy customer.
- Each review must have a different tone and structure.
- Mention specific services, products, or qualities related to the category.
- Add small real-life details (staff behavior, product quality, pricing, speed of service, cleanliness, etc.).
- Keep each review between 70–100 words.
- Make it natural and easy to understand.
- Do NOT repeat sentences or opening lines.
- Write in paragraph format only.
- Make it feel like a genuine 5-star experience.
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