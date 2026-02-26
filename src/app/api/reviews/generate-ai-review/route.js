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
- Use simple and clear English that everyone can understand.
- Do NOT use any negative or neutral words.
- Each review must sound like written by a real happy customer.
- Each review must have a different tone and structure.
- Mention specific services, products, or qualities related to the category.
- Add small real-life details (like staff help, product quality, pricing, cleanliness, speed of service, etc.).
- Keep each review between 70–100 words.
- Make it natural and emotional, but not dramatic.
- Do NOT repeat sentences or phrases across reviews.
- Avoid overused lines like only "Highly recommended".
- Make it feel like a genuine 5-star experience.
- Write in paragraph format (no numbering, no bullet points).
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