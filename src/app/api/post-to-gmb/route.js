const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body) {
      return new Response(
        JSON.stringify({ ok: false, error: "Payload missing" }),
        { status: 400 }
      );
    }

    // ✅ Handle array payload
    const requestData = Array.isArray(body) ? body[0] : body;

    const {
      userId,
      locations = [],
      prompt,
      logo,
    } = requestData;

    // =========================
    // ✅ STEP 1: CALL N8N
    // =========================
    const response = await fetch(
      "https://n8n.srv968758.hstgr.cloud/webhook/cc144420-81ab-43e6-8995-9367e92363b0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body), // same payload forward
      }
    );

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    // =========================
    // ❌ IF FAILED → RETURN
    // =========================
    if (!response.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: "GMB post failed", data }),
        { status: response.status }
      );
    }

    // =========================
    // ✅ STEP 2: COIN CALCULATION
    // =========================
    const totalPostCost = locations.length * 20;

    // =========================
    // ✅ STEP 3: WALLET CALL (ONLY AFTER SUCCESS)
    // =========================
    const walletRes = await fetch(
      `${API_URL}/api/auth/signup?userId=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPostCost,
          type: "deduct",
          reason: "Post-on-GMB",
          metadata: {
            prompt,
            logoUsed: !!logo,
            locationsCount: locations.length,
          },
        }),
      }
    );

    const walletData = await walletRes.json();

    // =========================
    // ✅ FINAL RESPONSE
    // =========================
    return new Response(
      JSON.stringify({
        ok: true,
        gmb: data,
        wallet: walletData,
        coinsDeducted: totalPostCost,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    );
  }
}