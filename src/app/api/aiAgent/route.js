import { uploadToS3 } from "@/utils/s3Config";

export async function POST(req) {
  let newPayload = {};

  try {
    // 1. Incoming Request Body (JSON) ko parse karein
    const body = await req.json();
    const { prompt, logo } = body;
    let finalLogoUrl = logo; // Default to the original logo URL

    // Cloudinary upload ki jagah ab S3 par upload karein
    if (logo) {
      if (logo.startsWith("data:")) {
        console.log("Uploading logo to S3...");

        // Extract MIME type and base64 data
        const arr = logo.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const base64Data = arr[1];

        const buffer = Buffer.from(base64Data, "base64");
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `agent-logo-${Date.now()}.${extension}`;

        // 2. Logo Buffer ko S3 par upload karein
        const uploadResult = await uploadToS3(buffer, fileName, mimeType);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload logo to S3");
        }

        // Upload successful hone par S3 ka URL use karein
        finalLogoUrl = uploadResult.url;
        console.log("Logo uploaded successfully. New URL:", finalLogoUrl);
      } else if (logo.startsWith("http")) {
        // If it's already a URL, just use it directly
        finalLogoUrl = logo;
      }
    }

    // 3. n8n ke liye naya payload taiyar karein
    newPayload = {
      prompt: prompt,
      logo: finalLogoUrl,
    };

    // 4. Naye payload ke saath POST request n8n webhook ko bhejein
    const response = await fetch(
      "https://n8n.srv968758.hstgr.cloud/webhook/f4b569d7-c402-4c76-993e-8bed20e1df95",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayload),
      }
    );

    const data = await response.json()

    // 5. Response ko frontend ko return karein
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in aiAgent API:", error);
    // Error hone par 500 status ke saath response return karein
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}