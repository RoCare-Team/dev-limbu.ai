// app/api/review-app/route.js
// GET  → fetch all reviews
// POST → fetch reviews with custom body

const LIMBU_BASE = "https://review.limbutech.in";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const acc_id = searchParams.get("acc_id");
    const locationIds = searchParams.getAll("locationIds"); // ?locationIds=x&locationIds=y
    const access_token = searchParams.get("access_token");
    const pageToken = searchParams.get("pageToken") || null;

    if (!acc_id || !access_token || locationIds.length === 0) {
      return Response.json(
        { success: false, error: "acc_id, access_token, and locationIds are required." },
        { status: 400 }
      );
    }

    const body = {
      acc_id,
      locationIds,
      access_token,
      ...(pageToken && { pageToken }),
    };

    const res = await fetch(`${LIMBU_BASE}/fetch-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : { reviews: [] };

    return Response.json({ success: true, ...data }, { status: res.status });
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { acc_id, locationIds, access_token, pageToken } = body;

    if (!acc_id || !access_token || !locationIds || locationIds.length === 0) {
      return Response.json(
        { success: false, error: "acc_id, access_token, and locationIds are required." },
        { status: 400 }
      );
    }

    // Paginate and collect all reviews
    const allReviews = [];
    let nextPageToken = pageToken || null;
    let pageCount = 0;
    const maxPages = 10;

    do {
      pageCount++;
      const requestBody = {
        acc_id,
        locationIds,
        access_token,
        ...(nextPageToken && { pageToken: nextPageToken }),
      };

      const res = await fetch(`${LIMBU_BASE}/fetch-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        return Response.json(
          { success: false, error: `Upstream error: ${res.status}` },
          { status: res.status }
        );
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : { reviews: [] };

      if (data.reviews && Array.isArray(data.reviews)) {
        allReviews.push(...data.reviews);
        nextPageToken = data.nextPageToken || null;
      } else {
        nextPageToken = null;
      }

      if (pageCount >= maxPages) break;
    } while (nextPageToken);

    // Sort by newest first
    const sorted = allReviews
      .map((r) => ({ ...r, _timestamp: new Date(r.createTime).getTime() }))
      .sort((a, b) => b._timestamp - a._timestamp);

    return Response.json({ success: true, total: sorted.length, reviews: sorted });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}