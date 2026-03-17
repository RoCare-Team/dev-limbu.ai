const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      userId,
      locationData = [],
      prompt,
      logo,
    } = body;

    console.log("Incoming Body:", body);

    // ============================
    // ✅ VALIDATION
    // ============================
    if (!userId) {
      return Response.json(
        { ok: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // ============================
    // ✅ COST
    // ============================
    const totalPostCost = (locationData?.length || 1) * 20;

    console.log("Total Cost:", totalPostCost);

    // ============================
    // ✅ 1. CALL N8N FIRST
    // ============================
    const response = await fetch(
      "https://n8n.srv968758.hstgr.cloud/webhook/cc144420-81ab-43e6-8995-9367e92363b0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body), // 🔥 SAME PAYLOAD
      }
    );

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    // ============================
    // ❌ IF WEBHOOK FAIL → STOP
    // ============================
    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          error: "Webhook failed",
          data,
        },
        { status: 500 }
      );
    }

    // ============================
    // ✅ 2. WALLET DEDUCT AFTER SUCCESS
    // ============================
    const walletRes = await fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totalPostCost,
        type: "deduct",
        reason: "Post-on-GMB",
        metadata: {
          prompt,
          logoUsed: !!logo,
          locationsCount: locationData.length,
        },
      }),
    });

    const walletData = await walletRes.json();

    console.log("walletData:", walletData);

    if (walletData?.error) {
      // ⚠️ rare case: webhook success but wallet fail
      return Response.json(
        {
          ok: true,
          warning: "Post created but wallet deduction failed",
          data,
        },
        { status: 200 }
      );
    }

    // ============================
    // ✅ FINAL RESPONSE
    // ============================
    return Response.json({
      ok: true,
      message: "GMB post successful",
      data,
      wallet: walletData,
      costDeducted: totalPostCost,
    });

  } catch (error) {
    console.error("POST TO GMB ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}