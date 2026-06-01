import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

const REVIEW_BASE_URL = "https://review.limbutech.in";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      userId,
      accountId,
      locationId,
      reviewerName,
      starRating,
      comment,
      reviewId,
      businessName,
      businessCategory,
    } = body || {};

    if (!userId || !accountId || !locationId || !reviewId) {
      return NextResponse.json(
        { success: false, error: "Missing required review reply fields" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({ userId, locationId });

    const upstream = await fetch(`${REVIEW_BASE_URL}/reply-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acc_id: accountId,
        access_token: accessToken,
        locationIds: locationId,
        Review_ID: reviewId,
        Reviewer_Name: reviewerName,
        Star_Rating: starRating,
        Review_Content: comment,
        Business_Language: "English",
        ...(businessCategory ? { Business_Category: businessCategory } : {}),
        ...(businessName ? { Business_Name: businessName } : {}),
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: text || "Failed to generate reply" },
        { status: upstream.status },
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch (error) {
    console.error("GMB review AI reply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
