import { NextResponse } from "next/server";
import { requireGmbSession } from "@/lib/gmbSession";
import { fetchLocationInsights } from "@/utils/fetchLocationInsights";
import { fetchSearchKeywords } from "@/utils/fetchSearchKeywords";

export const dynamic = "force-dynamic";

/**
 * Pehle browser seedha Google ko call karta tha `session.accessToken` se —
 * yaani access token client tak pahunchta tha. Ab token sirf server par rehta
 * hai aur ye route proxy ka kaam karta hai (dashboard-live jaisa hi pattern).
 *
 * GET /api/gmb/location-insights
 *   ?locationId=123&startDate=ISO&endDate=ISO
 *   &startMonthYear=2026&startMonth=4&endMonthYear=2026&endMonth=7
 */
export async function GET(request) {
  const { session, error } = await requireGmbSession(request);
  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  const sp = new URL(request.url).searchParams;
  const locationId = sp.get("locationId")?.trim();
  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  const startDate = new Date(sp.get("startDate"));
  const endDate = new Date(sp.get("endDate"));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "valid startDate and endDate required" },
      { status: 400 },
    );
  }

  try {
    const insights = await fetchLocationInsights(
      session.accessToken,
      locationId,
      startDate,
      endDate,
    );

    // Keywords optional hain — fail hone par insights phir bhi lauta do.
    let searchKeywords = null;
    const startMonth = {
      year: parseInt(sp.get("startMonthYear"), 10),
      month: parseInt(sp.get("startMonth"), 10),
    };
    const endMonth = {
      year: parseInt(sp.get("endMonthYear"), 10),
      month: parseInt(sp.get("endMonth"), 10),
    };
    if (
      Number.isFinite(startMonth.year) &&
      Number.isFinite(startMonth.month) &&
      Number.isFinite(endMonth.year) &&
      Number.isFinite(endMonth.month)
    ) {
      try {
        const kw = await fetchSearchKeywords(
          session.accessToken,
          locationId,
          startMonth,
          endMonth,
        );
        searchKeywords = kw?.searchKeywordsCounts || kw || null;
      } catch (kwErr) {
        console.warn("[location-insights] keywords failed:", kwErr.message);
      }
    }

    return NextResponse.json({ success: true, insights, searchKeywords });
  } catch (err) {
    console.error("[location-insights]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch insights" },
      { status: 502 },
    );
  }
}
