import { normalizeGenerateAdResponse } from "@/lib/normalizeGenerateAdResponse";

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
      mode,
      instructions,
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
      },
    );

    const responseText = await n8nResponse.text();
    let parsed;
    try {
      parsed = responseText ? JSON.parse(responseText) : {};
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "generate-ad returned non-JSON",
          detail: responseText?.slice?.(0, 300) ?? "",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!n8nResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            parsed?.message ||
            parsed?.error ||
            `generate-ad HTTP ${n8nResponse.status}`,
          data: parsed,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const normalized = normalizeGenerateAdResponse(parsed);

    return new Response(
      JSON.stringify({ success: true, data: normalized }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
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
