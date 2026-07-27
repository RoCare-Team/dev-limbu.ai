// File: /app/api/local-rank/route.js
//
// Local Rank Tracker webhook proxy — internal endpoint, app team ke liye bhi.
//
// Flow:
//   1. Client (dashboard ya app) JSON payload POST karta hai.
//   2. Hum wahi payload aage rank-checker n8n webhook ko bhejte hain.
//   3. Webhook ka response usi request me wapas de dete hain (synchronous).

export const dynamic = "force-dynamic";

const RANK_WEBHOOK_URL =
  process.env.LOCAL_RANK_WEBHOOK_URL ||
  "https://n8n.limbutech.in/webhook/webhook";

export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(RANK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: error.message,
    });
  }
}

/** Health check — endpoint verify karne ke liye. */
export async function GET() {
  return Response.json({
    success: true,
    message: "Local rank webhook proxy is live. POST your payload here.",
    target: RANK_WEBHOOK_URL,
  });
}
