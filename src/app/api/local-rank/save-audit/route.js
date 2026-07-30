// File: /app/api/local-rank/save-audit/route.js
//
// Ek hi call me: (1) payload se rank webhook hit karo, (2) response se zaroori
// data nikaalo, (3) LocalRankResult model me save karke saved doc lauta do.
//
// App (Flutter) yahi endpoint use karta hai. Purana /api/local-rank/save
// (jahan app pehle se computed data bhejta hai) isse alag aur untouched hai.
//
// PAYLOAD:
// {
//   "keywords": "ro service near me, ro repair near me",
//   "city": "shahin bagh delhi",
//   "bussiness_name": "RO Care India",
//   "grid_size": "3",                 // side length ("1"/"3"/"5") ya "3x3"
//   "place_id": "ChIJEchy...",
//   "userId": "665f...",
//   // optional identity: email, fullName, phone, plan, locationId
// }

import dbConnect from "@/lib/dbConnect";
import LocalRankResult from "@/models/LocalRankResult";

export const dynamic = "force-dynamic";

const RANK_WEBHOOK_URL =
  process.env.LOCAL_RANK_WEBHOOK_URL ||
  "https://n8n.limbutech.in/webhook/webhook";

/* ─────────── Normalizers (server-side; hook jaisa hi logic) ─────────── */

function normalizePoint(point) {
  const rank = point.businessRank ?? point.rank ?? null;
  return {
    lat: point.lat,
    lng: point.lng,
    area: point.area || "",
    isCenter: !!point.isCenter,
    businessRank: rank,
    businessFound: rank != null,
    competitors: (point.competitors || []).map((c) => ({
      rank: c.rank ?? null,
      placeId: c.placeId || "",
      name: c.name || "",
      rating: c.rating ?? null,
      reviews: c.reviews ?? 0,
      address: c.address || "",
    })),
  };
}

function buildTopCompetitorsFromGrid(gridResults) {
  const map = new Map();
  (gridResults || []).forEach((pt) => {
    (pt.competitors || []).forEach((c) => {
      const key = c.placeId || c.name;
      if (!key) return;
      const cur = map.get(key) || {
        placeId: c.placeId || "",
        name: c.name || "",
        rating: c.rating ?? null,
        reviews: c.reviews ?? 0,
        address: c.address || "",
        ranks: [],
      };
      if (typeof c.rank === "number") cur.ranks.push(c.rank);
      if ((c.reviews ?? 0) > (cur.reviews ?? 0)) {
        cur.rating = c.rating ?? cur.rating;
        cur.reviews = c.reviews ?? cur.reviews;
      }
      map.set(key, cur);
    });
  });
  const rows = [...map.values()].map((c) => {
    const frequency = c.ranks.length;
    return {
      placeId: c.placeId,
      name: c.name,
      rating: c.rating,
      reviews: c.reviews,
      address: c.address,
      frequency,
      averageRank: frequency
        ? Math.round((c.ranks.reduce((a, b) => a + b, 0) / frequency) * 10) / 10
        : null,
      score: c.ranks.reduce((a, r) => a + Math.max(0, 21 - r), 0),
    };
  });
  rows.sort(
    (a, b) =>
      b.frequency - a.frequency ||
      (a.averageRank ?? 99) - (b.averageRank ?? 99) ||
      b.score - a.score,
  );
  return rows.slice(0, 20).map((c, i) => ({ ...c, rank: i + 1 }));
}

function normalizeTopCompetitors(entry) {
  const list = Array.isArray(entry?.top_competitors) ? entry.top_competitors : [];
  if (list.length === 0) return buildTopCompetitorsFromGrid(entry?.grid_results);
  return list.map((c) => ({
    rank: c.rank ?? null,
    placeId: c.placeId || "",
    name: c.name || "",
    score: c.score ?? null,
    frequency: c.frequency ?? 0,
    averageRank: typeof c.average_rank === "number" ? c.average_rank : null,
    rating: c.rating ?? null,
    reviews: c.reviews ?? 0,
    address: c.address || "",
  }));
}

function normalizeAveragePosition(entry) {
  const a = entry?.business_average_position;
  if (!a) return null;
  return {
    averageRank: typeof a.average_rank === "number" ? a.average_rank : null,
    frequency: a.frequency ?? 0,
    totalGridPoints: a.total_grid_points ?? 0,
    businessName: entry.business_name || "",
  };
}

function normalizeKeywordEntry(entry) {
  const gridPoints = (entry.grid_results || []).map(normalizePoint);
  return {
    keyword: entry.keyword || "",
    businessName: entry.business_name || "",
    gridPoints,
    averagePosition: normalizeAveragePosition(entry),
    topCompetitors: normalizeTopCompetitors(entry),
  };
}

function pickTopLevel(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return (
    list.find(
      (x) =>
        x?.business_details ||
        Array.isArray(x?.overall_top_competitors) ||
        Array.isArray(x?.results) ||
        x?.overall_business_average_position,
    ) || null
  );
}

function extractKeywordEntries(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const withResults = list.find((x) => Array.isArray(x?.results));
  if (withResults) return withResults.results;
  if (list.some((x) => Array.isArray(x?.grid_results))) return list;
  return [];
}

function extractOverallTopCompetitors(raw) {
  const entry = pickTopLevel(raw);
  const list = Array.isArray(entry?.overall_top_competitors)
    ? entry.overall_top_competitors
    : [];
  return list.map((c, i) => ({
    rank: c.rank ?? i + 1,
    placeId: c.placeId || "",
    name: c.name || "",
    score: c.score ?? null,
    keywordsAppearedIn: c.keywords_appeared_in ?? 0,
    frequency: c.frequency ?? 0,
    averageRank: typeof c.average_rank === "number" ? c.average_rank : null,
    rating: c.rating ?? null,
    reviews: c.reviews ?? 0,
    address: c.address || "",
    logoUrl: c.logo_url || "",
    website: c.website || "",
    phone: c.phone || "",
  }));
}

function extractBusinessDetails(raw) {
  const b = pickTopLevel(raw)?.business_details;
  if (!b) return null;
  return {
    name: b.name || "",
    placeId: b.place_id || "",
    address: b.address || "",
    logoUrl: b.logo_url || "",
    rating: b.rating ?? null,
    reviews: b.reviews ?? 0,
    recentReviews6mo: b.recent_reviews_6mo ?? null,
    photoCount: b.photo_count ?? null,
    website: b.website || "",
    phone: b.phone || "",
    hoursListed: !!b.hours_listed,
    openNow: b.open_now ?? null,
    category: b.category || (b.categories && b.categories[0]) || "",
    businessStatus: b.business_status || "",
    mapsUri: b.google_maps_uri || "",
    distanceFromCenterKm:
      typeof b.distance_from_search_center_km === "number"
        ? b.distance_from_search_center_km
        : null,
  };
}

function extractOverallAveragePosition(raw) {
  const a = pickTopLevel(raw)?.overall_business_average_position;
  if (!a) return null;
  return {
    averageRank: typeof a.average_rank === "number" ? a.average_rank : null,
    frequency: a.frequency ?? 0,
    totalGridPoints: a.total_checks ?? a.total_grid_points ?? 0,
  };
}

function extractComparison(raw) {
  const list = pickTopLevel(raw)?.overall_comparison_vs_top_competitors;
  if (!Array.isArray(list)) return [];
  return list.map((c) => ({
    name: c.competitor || "",
    logoUrl: c.competitor_logo_url || "",
    competitorAvgRank: c.competitor_average_rank ?? null,
    competitorRating: c.competitor_rating ?? null,
    competitorReviews: c.competitor_reviews ?? 0,
    businessAvgRank: c.business_average_rank ?? null,
    businessRating: c.business_rating ?? null,
    businessReviews: c.business_reviews ?? 0,
    rankGap: c.rank_gap ?? null,
    ratingGap: c.rating_gap ?? null,
    reviewsGap: c.reviews_gap ?? null,
    verdict: c.verdict || "",
  }));
}

function extractSuggestions(raw) {
  const list = pickTopLevel(raw)?.overall_improvement_suggestions;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function computeSummary(gridPoints) {
  return {
    totalPoints: gridPoints.length,
    rankedPoints: gridPoints.filter((p) => p.businessFound).length,
    bestRank: gridPoints.reduce((best, p) => {
      if (p.businessRank == null) return best;
      return best == null ? p.businessRank : Math.min(best, p.businessRank);
    }, null),
  };
}

function gridSide(grid) {
  const side = parseInt(String(grid || "").split("x")[0], 10);
  return Number.isFinite(side) ? side : 1;
}

/* ───────────────────────────── Route ───────────────────────────── */

export async function POST(req) {
  try {
    const body = (await req.json()) || {};
    const {
      keywords,
      city,
      bussiness_name: businessName,
      grid_size,
      place_id,
      userId,
      email,
      fullName,
      phone,
      plan,
      locationId,
    } = body;

    if (!userId) {
      return Response.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }
    if (!keywords || !city || !businessName) {
      return Response.json(
        { success: false, message: "keywords, city and bussiness_name are required" },
        { status: 400 },
      );
    }

    const side = gridSide(grid_size);

    // 1) Rank webhook hit karo.
    const webhookRes = await fetch(RANK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          keywords: String(keywords),
          city,
          bussiness_name: businessName,
          grid_size: String(side),
          place_id: place_id || "",
        },
      ]),
    });

    if (!webhookRes.ok) {
      return Response.json(
        { success: false, message: `Rank webhook error ${webhookRes.status}` },
        { status: 502 },
      );
    }

    const webhookJson = await webhookRes.json();
    // Webhook seedha object/array deta hai; kabhi { success, data } bhi ho sakta.
    const payload = webhookJson?.data ?? webhookJson;

    // 2) Zaroori data nikaalo.
    const entries = extractKeywordEntries(payload);
    if (!Array.isArray(entries) || entries.length === 0) {
      return Response.json(
        { success: false, message: "No rank results returned from webhook" },
        { status: 502 },
      );
    }

    const keywordResults = entries.map(normalizeKeywordEntry);
    const first = keywordResults[0];
    const points = first?.gridPoints || [];
    const summary = computeSummary(points);

    // 3) DB me save karo.
    await dbConnect();
    const saved = await LocalRankResult.create({
      userId,
      email: email || "",
      fullName: fullName || "",
      phone: phone || "",
      plan: plan || "",
      keyword: String(keywords),
      city: city || "",
      businessName: businessName || "",
      locationId: locationId || "",
      placeId: place_id || "",
      gridSize: `${side}x${side}`,
      // active (pehla) keyword
      points,
      summary,
      averagePosition: first?.averagePosition || null,
      topCompetitors: first?.topCompetitors || [],
      // full audit
      keywordResults,
      businessDetails: extractBusinessDetails(payload),
      overallAveragePosition: extractOverallAveragePosition(payload),
      overallTopCompetitors: extractOverallTopCompetitors(payload),
      comparison: extractComparison(payload),
      suggestions: extractSuggestions(payload),
      rawResponse: payload ?? null,
    });

    return Response.json({ success: true, data: saved });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// Heavy/private fields jo kabhi wapas nahi bhejne.
const HIDE = "-rawResponse -__v -email -fullName -phone -plan -locationId";

/**
 * GET —
 *  • `?id=<auditId>`  → us ek audit ka POORA data (points, competitors, overall...).
 *  • warna `?userId=` → us user ke saare audits ki LIGHT list (bas basic fields),
 *    taaki multiple saves pe response bhaari na ho.
 *
 * Optional filters (list mode): keyword | businessName | gridSize
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await dbConnect();

    // ── Single audit — poora data ──
    if (id) {
      const doc = await LocalRankResult.findById(id).select(HIDE).lean();
      if (!doc) {
        return Response.json(
          { success: false, message: "Audit not found" },
          { status: 404 },
        );
      }
      return Response.json({ success: true, data: doc });
    }

    // ── List — light summary only ──
    const userId = searchParams.get("userId");
    if (!userId) {
      return Response.json(
        { success: false, message: "userId (ya id) is required" },
        { status: 400 },
      );
    }

    const keyword = searchParams.get("keyword");
    const businessName = searchParams.get("businessName");
    const gridSize = searchParams.get("gridSize");

    const query = { userId };
    if (keyword) query.keyword = keyword;
    if (businessName) query.businessName = businessName;
    if (gridSize) query.gridSize = gridSize;

    const results = await LocalRankResult.find(query)
      // Sirf zaroori light fields — baaki sab single (?id=) call se aayega.
      .select("keyword city businessName createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return Response.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
