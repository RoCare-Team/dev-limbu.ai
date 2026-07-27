// File: /app/api/local-rank/place-id/route.js
//
// Business ka Google `place_id` resolve karta hai — GMB connect ho ya na ho,
// dono case me chalta hai. Google Places Text Search (v1) use karta hai.
//
// Body: { businessName, city }
// Response: { success, places: [{ placeId, name, address, rating, reviews }] }

export const dynamic = "force-dynamic";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
].join(",");

function placesApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

export async function POST(req) {
  try {
    const { businessName, city } = await req.json().catch(() => ({}));

    if (!businessName?.trim()) {
      return Response.json(
        { success: false, message: "businessName is required" },
        { status: 400 },
      );
    }

    const apiKey = placesApiKey();
    if (!apiKey) {
      return Response.json(
        { success: false, message: "Google Places API key not configured" },
        { status: 500 },
      );
    }

    const textQuery = [businessName.trim(), city?.trim()]
      .filter(Boolean)
      .join(" ");

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({ textQuery, maxResultCount: 8 }),
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        {
          success: false,
          message: data?.error?.message || "Google Places request failed",
        },
        { status: 502 },
      );
    }

    const places = (Array.isArray(data.places) ? data.places : [])
      .filter((p) => p?.id)
      .map((p) => ({
        placeId: p.id,
        name: p.displayName?.text || businessName,
        address: p.formattedAddress || "",
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? 0,
      }));

    if (places.length === 0) {
      return Response.json(
        { success: false, message: "No place found for this business" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, places });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
