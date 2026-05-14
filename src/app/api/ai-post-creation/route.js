import { normalizeGenerateAdResponse } from "@/lib/normalizeGenerateAdResponse";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      userId,
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
      prompt,
    } = body;

    // ============================
    // ✅ Base64 cleaner
    // ============================
    const cleanBase64 = (str) => {
      if (typeof str === "string" && str.startsWith("data:image")) {
        return str.split(",")[1];
      }
      return str || "";
    };

    // ============================
    // ✅ Payload for n8n
    // ============================
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
    };

    const refundWallet = () =>
      fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 80,
          type: "credit",
          reason: "refund_failed_generation",
        }),
      });

    // ============================
    // ✅ 1. WALLET DEDUCT FIRST
    // ============================
    const walletRes = await fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 80,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          prompt,
          logoUsed: !!logoImage,
        },
      }),
    });

    const walletData = await walletRes.json();
    console.log("walletData:", walletData);

    if (walletData?.error) {
      return Response.json({
        success: false,
        error: walletData.error,
      }, { status: 400 });
    }

    // ============================
    // ✅ 2. AI GENERATION
    // ============================
    const n8nResponse = await fetch(
      "https://assets-image.limbutech.in/generate-ad",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await n8nResponse.text();
    let parsed;
    try {
      parsed = responseText ? JSON.parse(responseText) : {};
    } catch {
      await refundWallet();
      console.error("generate-ad non-JSON:", responseText?.slice?.(0, 400));
      return Response.json(
        {
          success: false,
          error: "generate-ad returned non-JSON",
          detail: responseText?.slice?.(0, 300) ?? "",
        },
        { status: 502 }
      );
    }

    if (!n8nResponse.ok) {
      await refundWallet();
      const msg =
        parsed?.message ||
        parsed?.error ||
        `generate-ad HTTP ${n8nResponse.status}`;
      console.error("AI Response (error):", msg, parsed);
      return Response.json(
        { success: false, error: msg, data: parsed },
        { status: 502 }
      );
    }

    const finalData = normalizeGenerateAdResponse(parsed);
    console.log("AI Response (normalized):", finalData);

    if (!finalData.output) {
      await refundWallet();
      return Response.json(
        {
          success: false,
          error: "AI generation failed",
          detail: parsed?.message || parsed?.error || null,
          data: parsed,
        },
        { status: 502 }
      );
    }

    // ============================
    // ✅ FIX: DESCRIPTION MAPPING
    // ============================
    const description =
      finalData.gmb_des ||
      finalData.description ||
      "AI generated post";

    // ============================
    // ✅ 3. SAVE POST
    // ============================
    const postRes = await fetch(`${API_URL}/api/post-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        aiOutput: finalData.output,
        description, // 🔥 FIXED
        gmbDescription: finalData.gmb_des || "",
        fbDescription: finalData.fb_des || "",
        igDescription: finalData.ig_des || "",
        logoUrl: finalData.logoUrl || "",
        status: "pending",
        promat: prompt,
        locations: [],
      }),
    });

    const savedPost = await postRes.json();
    console.log("savedPost:", savedPost);

    // ============================
    // ✅ FINAL RESPONSE
    // ============================
    return Response.json({
      success: true,
      data: finalData,
      post: savedPost,
      wallet: walletData,
    });

  } catch (error) {
    console.error("Error:", error);

    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}