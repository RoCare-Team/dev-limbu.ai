// app/api/review-app/manual-reply/route.js
// POST → send a manual text reply to a review

const LIMBU_BASE = "https://review.limbutech.in";

export async function POST(request) {
  try {
    const body = await request.json();

    const { acc_id, access_token, locationId, reviewId, reply } = body;

    if (!acc_id || !access_token || !locationId || !reviewId || !reply) {
      return Response.json(
        {
          success: false,
          error: "acc_id, access_token, locationId, reviewId, and reply are required.",
        },
        { status: 400 }
      );
    }

    if (typeof reply !== "string" || reply.trim() === "") {
      return Response.json(
        { success: false, error: "reply must be a non-empty string." },
        { status: 400 }
      );
    }

    const res = await fetch(`${LIMBU_BASE}/manual-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acc_id,
        access_token,
        locationIds: locationId,
        Review_ID: reviewId,
        reply: reply.trim(),
      }),
    });

    if (!res.ok) {
      return Response.json(
        { success: false, error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json({ success: true, ...data }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/reviews/manual-reply]", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}