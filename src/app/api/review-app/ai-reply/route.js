// app/api/review-app/ai-reply/route.js
// POST → generate and send AI reply to a review

const LIMBU_BASE = "https://review.limbutech.in";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      acc_id,
      access_token,
      locationId,
      reviewId,
      reviewerName,
      starRating,       // number 1-5  OR  string "FIVE","FOUR","THREE","TWO","ONE"
      reviewContent,
      businessName,
      businessCategory,
      businessLanguage = "English",
    } = body;

    // Validate required fields
    if (!acc_id || !access_token || !locationId || !reviewId) {
      return Response.json(
        { success: false, error: "acc_id, access_token, locationId, and reviewId are required." },
        { status: 400 }
      );
    }

    // Normalize starRating: accept both numeric and string forms
    const starRatingMap = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
    const normalizedRating =
      typeof starRating === "string" && isNaN(starRating)
        ? starRatingMap[starRating.toUpperCase()] || 5
        : Number(starRating) || 5;

    const payload = {
      acc_id,
      access_token,
      locationIds: locationId,
      Review_ID: reviewId,
      Reviewer_Name: reviewerName || "Anonymous",
      Star_Rating: normalizedRating,
      Review_Content: reviewContent || "No comment provided",
      Business_Language: businessLanguage,
      ...(businessCategory && { Business_Category: businessCategory }),
      ...(businessName && { Business_Name: businessName }),
    };

    const res = await fetch(`${LIMBU_BASE}/reply-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return Response.json(
      { success: data.status === true, ...data },
      { status: res.status }
    );
  } catch (err) {
    console.error("[POST /api/reviews/ai-reply]", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}