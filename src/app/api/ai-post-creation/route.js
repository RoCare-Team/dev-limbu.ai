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
    };

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

    if (!walletData?.success) {
      return Response.json({
        success: false,
        error: "Insufficient wallet balance",
      }, { status: 400 });
    }

    // ============================
    // ✅ 2. AI GENERATION
    // ============================
    const n8nResponse = await fetch(
      "https://n8n.limbutech.in/webhook/6678555b-a0a2-4cbf-b157-7d0f831bd51c",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const finalData = await n8nResponse.json();

    if (!finalData || !finalData.output) {
      // 🔁 REFUND if AI fails
      await fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 80,
          type: "credit",
          reason: "refund_failed_generation",
        }),
      });

      throw new Error("AI generation failed");
    }

    // ============================
    // ✅ 3. SAVE POST
    // ============================
    const postRes = await fetch(`${API_URL}/api/post-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        aiOutput: finalData.output,
        description: finalData.description || "",
        gmbDescription: finalData.gmbDesc || "",
        fbDescription: finalData.fbDesc || "",
        igDescription: finalData.igDesc || "",
        logoUrl: finalData.logoUrl || "",
        status: "pending",
        promat: prompt,
        locations: [],
      }),
    });

    const savedPost = await postRes.json();

    // ============================
    // ✅ 4. INCREMENT POST COUNT
    // ============================
    // if (savedPost?.success) {
    //   await fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       type: "increment_posts_used",
    //       amount: 1,
    //     }),
    //   });
    // }

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