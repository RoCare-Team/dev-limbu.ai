import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

const REVIEW_BASE_URL = "https://review.limbutech.in";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, accountId, locationIds, pageToken } = body || {};
    const firstLocationId = Array.isArray(locationIds) ? locationIds[0] : locationIds;

    if (!userId || !accountId || !firstLocationId) {
      return NextResponse.json(
        { success: false, error: "Missing userId, accountId, or locationIds" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({
      userId,
      locationId: firstLocationId,
    });

    const upstream = await fetch(`${REVIEW_BASE_URL}/fetch-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acc_id: accountId,
        locationIds,
        access_token: accessToken,
        ...(pageToken ? { pageToken } : {}),
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: text || "Failed to fetch reviews" },
        { status: upstream.status },
      );
    }

    return NextResponse.json(text ? JSON.parse(text) : { reviews: [] });
  } catch (error) {
    console.error("GMB reviews error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
