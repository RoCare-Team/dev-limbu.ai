import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const locationId = searchParams.get("locationId");
    const startYear = searchParams.get("startYear");
    const startMonth = searchParams.get("startMonth");
    const endYear = searchParams.get("endYear");
    const endMonth = searchParams.get("endMonth");

    if (!userId || !locationId || !startYear || !startMonth || !endYear || !endMonth) {
      return NextResponse.json(
        { success: false, error: "Missing userId, locationId, or month range" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({ userId, locationId });
    const params = new URLSearchParams({
      "monthlyRange.start_month.year": startYear,
      "monthlyRange.start_month.month": startMonth,
      "monthlyRange.end_month.year": endYear,
      "monthlyRange.end_month.month": endMonth,
    });

    const response = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/locations/${encodeURIComponent(locationId)}/searchkeywords/impressions/monthly?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: text || "Failed to fetch GMB search keywords" },
        { status: response.status },
      );
    }

    return NextResponse.json(JSON.parse(text || "{}"));
  } catch (error) {
    console.error("GMB search keywords error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
