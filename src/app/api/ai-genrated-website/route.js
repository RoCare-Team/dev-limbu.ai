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
  },
  "imageKeywords": ["", "", ""]
}

Rules:
- imageKeywords: provide 3 specific visual keywords describing what photos of this business look like (e.g. "modern salon interior", "hair styling", "beauty treatment"). These will be used to generate or search for relevant images.
- Each service's imageKeyword: a short phrase describing a photo for that specific service.
- Make it highly professional, SEO optimized, modern and premium.
- Do not add explanations.
- Only return valid JSON.
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

    // Generate slug from the business details
    const slug = generateSlug(title, locality, "");

    // If userId is provided, save to database
    if (userId) {
      try {
        await dbConnect();
        
        // Check if slug already exists for this user
        let finalSlug = slug;
        let counter = 0;
        let existingSite = await Site.findOne({ slug: finalSlug, userId });
        
        while (existingSite) {
          counter++;
          finalSlug = `${slug}-${counter}`;
          existingSite = await Site.findOne({ slug: finalSlug, userId });
        }

        // Save the website to database
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
          isPublished: true,
        });

        await site.save();

        return Response.json({ 
          content: parsed, 
          slug: finalSlug,
          saved: true 
        });
      } catch (dbError) {
        console.error("Database Save Error:", dbError);
        // Return the content even if save fails
        return Response.json({ 
          content: parsed, 
          slug: slug,
          saved: false,
          saveError: dbError.message 
        });
      }
    }

    // If no userId, just return the content with slug (preview mode)
    return Response.json({ 
      content: parsed, 
      slug: slug,
      saved: false 
    });

  } catch (err) {
    console.error("AI Website Generation Error:", err);
    return Response.json(
      { error: "AI website generation failed" },
      { status: 500 }
    );
  }
}
