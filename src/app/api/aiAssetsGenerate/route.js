
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      topic,
      colourPalette,
      size,
      bussiness_name,
      keywords,
      characterImage,   // base64
      uniformImage,     // base64
      productImage,     // base64
      backgroundImage,  // base64
      logoImage,        // base64
    } = body;

    console.log("Received base64 images, forwarding to n8n...");

    const cleanBase64 = (str) => {
      if (typeof str === "string" && str.startsWith("data:image")) {
        return str.split(",")[1];
      }
      console.log("cleanBase64cleanBase64cleanBase64",str);
      
      return str;
    };

    // ✔ Payload directly with base64
    const newPayload = {
      topic,
      colourPalette,
      size,
      bussiness_name,
      keywords,
      characterImage: cleanBase64(characterImage),
      uniformImage: cleanBase64(uniformImage),
      productImage: cleanBase64(productImage),
      backgroundImage: cleanBase64(backgroundImage),
      logoImage: cleanBase64(logoImage),
    };

    console.log("newPayloadnewPayloadnewPayload",newPayload);
    

    const n8nResponse = await fetch(
      "https://n8n.limbutech.in/webhook/6678555b-a0a2-4cbf-b157-7d0f831bd51c",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayload),
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
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
