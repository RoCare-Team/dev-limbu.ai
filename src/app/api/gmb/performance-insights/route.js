import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getGoogleBusinessAccessToken } from "@/lib/googleBusinessToken";

function readDate(prefix, searchParams) {
  return {
    year: searchParams.get(`${prefix}.year`),
    month: searchParams.get(`${prefix}.month`),
    day: searchParams.get(`${prefix}.day`),
  };
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const locationId = searchParams.get("locationId");
    const start = readDate("startDate", searchParams);
    const end = readDate("endDate", searchParams);

    if (!userId || !locationId || !start.year || !start.month || !start.day || !end.year || !end.month || !end.day) {
      return NextResponse.json(
        { success: false, error: "Missing userId, locationId, startDate, or endDate" },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleBusinessAccessToken({ userId, locationId });
    const params = new URLSearchParams({
      "dailyRange.startDate.year": start.year,
      "dailyRange.startDate.month": start.month,
      "dailyRange.startDate.day": start.day,
      "dailyRange.endDate.year": end.year,
      "dailyRange.endDate.month": end.month,
      "dailyRange.endDate.day": end.day,
    });

    [
      "BUSINESS_DIRECTION_REQUESTS",
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    ].forEach((metric) => params.append("dailyMetrics", metric));

    const response = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/locations/${encodeURIComponent(locationId)}:fetchMultiDailyMetricsTimeSeries?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: text || "Failed to fetch GMB insights" },
        { status: response.status },
      );
    }

    return NextResponse.json(JSON.parse(text || "{}"));
  } catch (error) {
    console.error("GMB performance insights error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
