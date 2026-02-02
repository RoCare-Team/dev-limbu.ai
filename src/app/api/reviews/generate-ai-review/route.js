import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { business, primaryCategory, additionalCategories } = await req.json();

    if (!primaryCategory) {
      return Response.json({ error: "Missing category info" }, { status: 400 });
    }

    // Prompt for positive review
    const prompt = `Write a short, positive, natural-sounding Google review for a business.\nBusiness: ${business}\nCategory: ${primaryCategory}${additionalCategories?.length ? `\nAdditional Categories: ${additionalCategories.join(", ")}` : ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a happy customer writing a Google review. Keep it short, natural, and positive." },
        { role: "user", content: prompt },
      ],
      n: 3,
      max_tokens: 80,
      temperature: 0.9,
    });

    const reviews = completion.choices.map((c) => c.message.content.trim());
    return Response.json({ reviews });
  } catch (err) {
    console.error("OpenAI Review Error:", err);
    return Response.json({ error: "Failed to generate review" }, { status: 500 });
  }
}
