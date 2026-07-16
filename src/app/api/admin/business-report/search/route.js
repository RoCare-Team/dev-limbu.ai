import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryType",
  "places.types",
  "places.businessStatus",
  "places.nationalPhoneNumber",
  "places.formattedAddress",
  "places.location",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.photos",
].join(",");

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Google Places text search for the "Generate Report" modal.
 * Honors the 10-day per-user cache: if this user already has a report fetched
 * within 10 days, it returns the stored business instead of hitting the API.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const { userId, businessName, city } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }
    if (!businessName?.trim() || !city?.trim()) {
      return NextResponse.json(
        { success: false, error: "Business name and city are required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId }).select("businessReport").lean();

    // 10-day cache guard — reuse stored place, no API hit.
    const fetchedAt = user?.businessReport?.fetchedAt
      ? new Date(user.businessReport.fetchedAt).getTime()
      : 0;
    const isFresh = fetchedAt && Date.now() - fetchedAt < TEN_DAYS_MS;

    if (isFresh && user?.businessReport?.place) {
      return NextResponse.json({
        success: true,
        cached: true,
        fetchedAt: user.businessReport.fetchedAt,
        pdfUrl: user.businessReport.pdfUrl || "",
        places: [user.businessReport.place],
      });
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Google Places API key not configured" },
        { status: 500 },
      );
    }

    const textQuery = `${businessName.trim()} ${city.trim()}`;

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({ textQuery, maxResultCount: 5 }),
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || "Google Places request failed",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      cached: false,
      places: Array.isArray(data.places) ? data.places : [],
    });
  } catch (error) {
    console.error("business-report/search error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
