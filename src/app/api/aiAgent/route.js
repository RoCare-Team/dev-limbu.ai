import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration (Aap ise file ke top par ya kisi config file mein rakh sakte hain)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  let newPayload = {};
  
  try {
    // 1. Incoming Request Body (JSON) ko parse karein
    const body = await req.json();
    const { prompt, logo, assets, mode, instructions } = body;
    let finalLogoUrl = logo; // Default to the original logo URL

    // Postman mein dikhaye gaye format: { "promet": "...", "logo": "..." }
    // Cloudinary upload sirf tab hi karein jab 'logo' field available ho
    if (logo) {
      console.log("Uploading logo to Cloudinary...");
      
      // 2. Logo URL ko Cloudinary par upload karein
      const uploadResult = await cloudinary.uploader.upload(logo, {
        folder: "ai_agent_logos", // Optional: Ek specific folder mein save karein
        resource_type: "image",
      });

      // Upload successful hone par naya secure URL use karein
      finalLogoUrl = uploadResult.secure_url;
      console.log("Logo uploaded successfully. New URL:", finalLogoUrl);
    }
    
    // 3. n8n ke liye naya payload taiyar karein
    newPayload = {
      prompt: prompt,
      logo: finalLogoUrl,
      assets: assets ?? [],
      mode: mode === "manual" ? "manual" : "ai",
      instructions: typeof instructions === "string" ? instructions : "",
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

    

    const data  = await response.json()
    

    // 5. Webhook se response ka intezaar karein
    // const data = await response.json();

    // 6. Response ko frontend ko return karein
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