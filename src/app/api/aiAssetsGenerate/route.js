export async function POST(req) {
  try {
    const body = await req.json();

    const {
      topic,
      bussiness_name,
      keywords,
      colourPalette,
      size,
      characterImage,
      uniformImage,
      productImage,
      backgroundImage,
      logoImage,
      platform,
      mode
      // instructions,
    } = body;

    const cleanBase64 = (str) => {
      if (typeof str === "string" && str.startsWith("data:image")) {
        return str.split(",")[1];
      }
      return str || "";
    };

    const payload = {
      topic: topic || "",
      bussiness_name: bussiness_name || "",
      keywords: keywords || "",
      colourPalette: colourPalette || "",
      size: size || "",
      characterImage: cleanBase64(characterImage),
      uniformImage: cleanBase64(uniformImage),
      productImage: cleanBase64(productImage),
      backgroundImage: cleanBase64(backgroundImage),
      logoImage: cleanBase64(logoImage),
      platform: platform || "",
      mode: mode === "manual" ? "manual" : "ai",
      // instructions: typeof instructions === "string" ? instructions : "",
    };

    console.log("Sending payload to n8n:", payload);

    const n8nResponse = await fetch(
      "https://assets-image.limbutech.in/generate-ad",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const finalData = await n8nResponse.json();

    return new Response(
      JSON.stringify({ success: true, data: finalData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
