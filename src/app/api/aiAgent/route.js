import { uploadToS3 } from "@/utils/s3Config";

export async function POST(req) {
  let newPayload = {};

  try {
    const body = await req.json();
    const { prompt, logo, assets, mode, instructions } = body;
    let finalLogoUrl = logo;

    if (logo) {
      if (logo.startsWith("data:")) {
        console.log("Uploading logo to S3...");
        const arr = logo.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const base64Data = arr[1];
        const buffer = Buffer.from(base64Data, "base64");
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `agent-logo-${Date.now()}.${extension}`;

        const uploadResult = await uploadToS3(buffer, fileName, mimeType);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload logo to S3");
        }
        finalLogoUrl = uploadResult.url;
        console.log("Logo uploaded successfully. New URL:", finalLogoUrl);
      } else if (logo.startsWith("http")) {
        finalLogoUrl = logo;
      }
    }

    newPayload = {
      prompt,
      logo: finalLogoUrl,
      assets: assets ?? [],
      mode: mode === "manual" ? "manual" : "ai",
      instructions: typeof instructions === "string" ? instructions : "",
    };

    const response = await fetch(
      "https://n8n.srv968758.hstgr.cloud/webhook/f4b569d7-c402-4c76-993e-8bed20e1df95",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayload),
      }
    );

    // ✅ FIX: Sirf ek baar parse karo
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "AI agent webhook returned non-JSON" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.message || data?.error || `Webhook ${response.status}`,
          data,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
      
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in aiAgent API:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}