import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

const REVIEW_BASE_URL = "https://review.limbutech.in";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, accountId, locationId, reviewId, replyText } = body || {};

    if (!userId || !accountId || !locationId || !reviewId || !replyText) {
      return NextResponse.json(
        { success: false, error: "Missing required manual reply fields" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({ userId, locationId });

    const upstream = await fetch(`${REVIEW_BASE_URL}/manual-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acc_id: accountId,
        access_token: accessToken,
        locationIds: locationId,
        Review_ID: reviewId,
        reply: replyText,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: text || "Failed to post reply" },
        { status: upstream.status },
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch (error) {
    console.error("GMB review manual reply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
