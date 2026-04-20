import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not defined");
  return new OpenAI({ apiKey });
}

/** Pull obvious keywords from business name for the model to weave in naturally. */
function keywordsFromBusinessName(business) {
  if (!business || typeof business !== "string") return [];
  return business
    .split(/[^a-zA-Z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)
    .slice(0, 8);
}

/**
 * Split model output into 5 review strings (handles numbered lists, blank lines, markdown).
 */
function parseReviewsFromText(text) {
  if (!text || typeof text !== "string") return [];
  let clean = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^[\s\*#]+/gm, "")
    .trim();

  const byNumbered = clean
    .split(/\n(?=\s*(?:Review\s*)?\d+[\.\)]\s)/i)
    .map((r) => r.replace(/^\s*(?:Review\s*)?\d+[\.\)]\s*/i, "").trim())
    .filter((r) => r.length > 40);

  if (byNumbered.length >= 3) {
    return byNumbered.slice(0, 5);
  }

  const paras = clean
    .split(/\n\n+/)
    .map((r) => r.replace(/^\s*(?:Review\s*)?\d+[\.\)]\s*/i, "").trim())
    .filter((r) => r.length > 40);

  if (paras.length >= 3) {
    return paras.slice(0, 5);
  }

  return clean
    .split("\n")
    .map((r) => r.replace(/^\s*(?:Review\s*)?\d+[\.\)]\s*/i, "").trim())
    .filter((r) => r.length > 40)
    .slice(0, 5);
}

export async function POST(req) {
  const openai = getOpenAIClient();
  try {
    const {
      business,
      primaryCategory,
      additionalCategories,
      locality,
      address,
    } = await req.json();

    if (!business || typeof business !== "string" || !business.trim()) {
      return Response.json({ error: "Missing business name" }, { status: 400 });
    }

    const categoryText = primaryCategory?.trim()
      ? additionalCategories?.length
        ? `${primaryCategory}, ${additionalCategories.join(", ")}`
        : primaryCategory
      : "Local business / general services";

    const locationHint = [locality, address]
      .filter(Boolean)
      .join(" — ")
      .trim();

    const nameKeywords = keywordsFromBusinessName(business);
    const keywordLine =
      nameKeywords.length > 0
        ? `Naturally include these business-related words (not all in every review): ${nameKeywords.join(", ")}.`
        : "Mention the business name or brand naturally at least once across the set of reviews.";

    const prompt = `
You write authentic, varied 5-star Google Maps reviews left by happy customers.

Business name: ${business.trim()}
Categories: ${categoryText}
${locationHint ? `Location / area context (use only if it sounds natural; do not invent visits): ${locationHint}` : ""}

Output EXACTLY 5 different reviews. For each review:
- ${keywordLine}
- Relate details to the category (services, products, staff, quality, timeliness, value).
- 100% positive; realistic tone; varied openings and structure; no copy-paste repetition between reviews.
- Simple, clear English; paragraph form only (no bullets).
- About 70–100 words each.
- Do not use double-negative praise (e.g. "no complaints", "couldn't be happier").
- Do not add URLs, phone numbers, or "review swap" language.

Format: number each review 1. through 5. with a blank line between reviews.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write believable Google Maps reviews as a satisfied customer. You follow the user's formatting and count exactly.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 900,
      temperature: 0.85,
    });

    const text = completion.choices[0].message.content;
    const reviews = parseReviewsFromText(text);

    if (!reviews.length) {
      return Response.json(
        { error: "Could not parse generated reviews" },
        { status: 502 }
      );
    }

    return Response.json({ reviews });
  } catch (err) {
    console.error("OpenAI Review Error:", err);
    return Response.json(
      { error: "Failed to generate review" },
      { status: 500 }
    );
  }
}
