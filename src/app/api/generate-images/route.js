import OpenAI from "openai";
import { uploadToS3 } from "@/utils/s3Config";

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

/**
 * POST /api/generate-images
 * Body: { businessType, businessName, locality, count, imageKeywords }
 * Returns: { images: [s3Url, ...] }
 */
export async function POST(req) {
  try {
    const {
      businessType = "professional business",
      businessName = "Business",
      locality = "",
      count = 2,
      imageKeywords = [],
    } = await req.json();

    const imageCount = Math.min(Math.max(Number(count), 1), 2); // clamp 1–2

    // Build a descriptive prompt for DALL-E
    const keywordStr =
      imageKeywords.length > 0
        ? imageKeywords.slice(0, 3).join(", ")
        : businessType;

    const prompt = `A high-quality, professional, photorealistic image for a ${businessType} business called "${businessName}"${
      locality ? ` located in ${locality}` : ""
    }. The image should showcase ${keywordStr}. Modern, clean, bright, commercial photography style. No text or logos.`;

    const openai = getOpenAIClient();
    const generatedUrls = [];

    for (let i = 0; i < imageCount; i++) {
      try {
        // Generate image with DALL-E 3
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural",
        });

        const dalleUrl = response.data[0]?.url;
        if (!dalleUrl) continue;

        // Fetch the image from DALL-E URL
        const imageResponse = await fetch(dalleUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `gmb-ai-generated-${Date.now()}-${i}.png`;
        const mimeType = "image/png";

        // Upload to S3 for persistence
        const uploadResult = await uploadToS3(buffer, fileName, mimeType);

        if (!uploadResult.success) {
           throw new Error(uploadResult.error || "Failed to upload to S3");
        }

        generatedUrls.push(uploadResult.url);
      } catch (imgErr) {
        console.error(`Image ${i + 1} generation/upload error:`, imgErr);
        // Continue to next image even if one fails
      }
    }

    if (generatedUrls.length === 0) {
      return Response.json(
        { error: "Failed to generate any images" },
        { status: 500 }
      );
    }

    return Response.json({ images: generatedUrls });
  } catch (err) {
    console.error("Generate Images Error:", err);
    return Response.json(
      { error: "Image generation failed", detail: err.message },
      { status: 500 }
    );
  }
}
