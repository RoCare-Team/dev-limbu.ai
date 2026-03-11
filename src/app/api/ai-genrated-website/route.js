import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import Site from "@/models/Site";
import { generateSlug } from "../../../../utils/generateSlug";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined`);
  return value;
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: getRequiredEnv("OPENAI_API_KEY"),
  });
}

export async function POST(req) {
  try {

    const {
      title,
      locality,
      primaryCategory,
      additionalCategories = [],
      userId,
      locationId,
      mediaImages = []
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
      "iconKeyword": "",
      "imageKeyword": ""
    }
  ],
  "features": ["","",""],
  "whyChooseUs": ["","",""],
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
  },
  "imageKeywords": ["","",""]
}
Return ONLY valid JSON.
`;

    const openai = getOpenAIClient();

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

    let raw = completion.choices[0].message.content;

    // Remove markdown if AI sends ```json
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

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

    // Generate base slug
    const baseSlug = generateSlug(title, locality);

    let finalSlug = baseSlug;
    let counter = 0;

    await dbConnect();

    // Check duplicate slug
    let existingSite = await Site.findOne({ slug: finalSlug });

    while (existingSite) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
      existingSite = await Site.findOne({ slug: finalSlug });
    }

    // If no userId -> preview mode
    if (!userId) {
      return Response.json({
        success: true,
        slug: finalSlug,
        preview: true,
        content: parsed,
        message: "Preview mode - site not saved"
      });
    }

    // Save to database
    const site = new Site({
      slug: finalSlug,
      userId,
      locationId: locationId || "",
      business: {
        title,
        locality,
        primaryCategory,
        additionalCategories,
      },
      aiContent: parsed,
      mediaImages,
      isPublished: true,
      updatedAt: new Date()
    });

    await site.save();

    return Response.json({
      success: true,
      slug: finalSlug,
      siteId: site._id,
      content: parsed,
      message: "Website generated and saved successfully"
    });

  } catch (err) {

    console.error("AI Website Generation Error:", err);

    return Response.json(
      { error: "AI website generation failed" },
      { status: 500 }
    );
  }
}