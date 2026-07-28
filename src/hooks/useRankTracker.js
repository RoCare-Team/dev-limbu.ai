"use client";
import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

const API_URL = "/api/local-rank";

/**
 * Normalizes a raw grid point from the webhook into something the map can use.
 * Webhook has used both `businessRank` and a flat `rank` — accept either.
 */
function normalizePoint(point) {
  const competitors = point.competitors || [];
  const rank = point.businessRank ?? point.rank ?? null;

  return {
    id: `${point.lat}_${point.lng}`,
    lat: point.lat,
    lng: point.lng,
    area: point.area || "",
    isCenter: !!point.isCenter,
    competitors,
    businessRank: rank,
    businessFound: rank != null,
  };
}

function normalizeAveragePosition(entry) {
  const avg = entry?.business_average_position;
  if (!avg) return null;
  return {
    averageRank: typeof avg.average_rank === "number" ? avg.average_rank : null,
    frequency: avg.frequency ?? 0,
    totalGridPoints: avg.total_grid_points ?? 0,
    businessName: entry.business_name || "",
  };
}

/**
 * Grid ke competitors se khud ka leaderboard banata hai — jab webhook
 * `top_competitors` na bheje (multi-keyword response me aksar nahi hota).
 * Har competitor ko placeId par group karke frequency + average rank nikaalta hai.
 */
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
      // Behtar rating/reviews mile to rakh lo.
      if ((c.reviews ?? 0) > (cur.reviews ?? 0)) {
        cur.rating = c.rating ?? cur.rating;
        cur.reviews = c.reviews ?? cur.reviews;
      }
      map.set(key, cur);
    });
  });

  const rows = [...map.values()].map((c) => {
    const frequency = c.ranks.length;
    const averageRank = frequency
      ? Math.round((c.ranks.reduce((a, b) => a + b, 0) / frequency) * 10) / 10
      : null;
    return {
      placeId: c.placeId,
      name: c.name,
      rating: c.rating,
      reviews: c.reviews,
      address: c.address,
      frequency,
      averageRank,
      // Score: jitni baar dikha + jitna upar raha, utna strong.
      score: c.ranks.reduce((a, r) => a + Math.max(0, 21 - r), 0),
    };
  });

  // Sabse strong upar — pehle frequency, phir behtar average rank.
  rows.sort(
    (a, b) =>
      b.frequency - a.frequency ||
      (a.averageRank ?? 99) - (b.averageRank ?? 99) ||
      b.score - a.score,
  );

  return rows.slice(0, 20).map((c, i) => ({ ...c, rank: i + 1 }));
}

function normalizeTopCompetitors(entry) {
  const list = Array.isArray(entry?.top_competitors)
    ? entry.top_competitors
    : [];
  if (list.length === 0) {
    // Webhook ne leaderboard nahi bheja — grid se khud bana lo.
    return buildTopCompetitorsFromGrid(entry?.grid_results);
  }
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

/**
 * One keyword's full result → { keyword, gridPoints, averagePosition, topCompetitors }.
 */
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

/**
 * Pull the per-keyword entries out of the webhook response.
 * New shape (multi-keyword): [{ results: [ {keyword, grid_results, ...}, ... ] }]
 * Old shape (single keyword): [{ keyword, grid_results, ... }]
 */
function extractKeywordEntries(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const withResults = list.find((x) => Array.isArray(x?.results));
  if (withResults) return withResults.results;
  if (list.some((x) => Array.isArray(x?.grid_results))) return list;
  return [];
}

/**
 * Webhook ka top-level `overall_top_competitors` — saare keywords ke aar-paar
 * ka ready-made leaderboard (score, keywords_appeared_in ke saath).
 */
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
    photoCount: c.photo_count ?? null,
    recentReviews: c.recent_reviews_count ?? null,
    avgDistanceKm:
      typeof c.average_distance_km === "number" ? c.average_distance_km : null,
    category: c.category || "",
  }));
}

/** Top-level object jahan overall_* fields hote hain (results-wala entry ya khud). */
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

/** Business ke apne GBP details (name, logo, rating, reviews, phone, website...). */
function extractBusinessDetails(raw) {
  const entry = pickTopLevel(raw);
  const b = entry?.business_details;
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

/** Overall average position — webhook ka `overall_business_average_position`. */
function extractOverallAveragePosition(raw) {
  const entry = pickTopLevel(raw);
  const a = entry?.overall_business_average_position;
  if (!a) return null;
  return {
    averageRank: typeof a.average_rank === "number" ? a.average_rank : null,
    frequency: a.frequency ?? 0,
    totalGridPoints: a.total_checks ?? a.total_grid_points ?? 0,
  };
}

/** Competitor gap analysis + verdict. */
function extractComparison(raw) {
  const entry = pickTopLevel(raw);
  const list = Array.isArray(entry?.overall_comparison_vs_top_competitors)
    ? entry.overall_comparison_vs_top_competitors
    : [];
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

/** Improvement suggestions (string list). */
function extractSuggestions(raw) {
  const entry = pickTopLevel(raw);
  return Array.isArray(entry?.overall_improvement_suggestions)
    ? entry.overall_improvement_suggestions.filter(Boolean)
    : [];
}

/** "3x3" → 3 (webhook only wants the side length). */
function toGridSide(gridSize) {
  const side = parseInt(String(gridSize || "").split("x")[0], 10);
  return Number.isFinite(side) ? side : 1;
}

/** "ro service, ro repair" → ["ro service", "ro repair"] */
function parseKeywords(keyword) {
  return String(keyword || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
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

export function useRankTracker() {
  // Per-keyword results + which one is active in the UI.
  const [keywordResults, setKeywordResults] = useState([]);
  const [overallTopCompetitors, setOverallTopCompetitors] = useState([]);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [overallAveragePosition, setOverallAveragePosition] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);

  // Saving / comparison state
  const [isSaving, setIsSaving] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchRanks = useCallback(
    async ({ keyword, city, businessName, gridSize, placeId }) => {
      const keywords = parseKeywords(keyword);
      if (keywords.length === 0 || !city || !businessName) {
        toast.error("Keyword, city and business name are all required.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              // Comma-separated keywords in a single call.
              keywords: keywords.join(", "),
              city,
              bussiness_name: businessName,
              grid_size: String(toGridSide(gridSize)),
              // Business ka GBP place id — id se match karta hai, naam se nahi.
              place_id: placeId || "",
            },
          ]),
        });

        if (!res.ok) {
          throw new Error(`Webhook returned ${res.status}`);
        }

        const result = await res.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to fetch data");
        }

        // Proxy `{ success, data }` deta hai jahan `data` khud webhook ka jawab
        // hai — jo array `[...]` bhi ho sakta hai ya object `{ results: [...] }`.
        const payload = result.data?.data ?? result.data;
        const entries = extractKeywordEntries(payload);

        if (!Array.isArray(entries) || entries.length === 0) {
          throw new Error("Unexpected response shape from API");
        }

        const normalized = entries.map(normalizeKeywordEntry);
        setKeywordResults(normalized);
        setOverallTopCompetitors(extractOverallTopCompetitors(payload));
        setBusinessDetails(extractBusinessDetails(payload));
        setOverallAveragePosition(extractOverallAveragePosition(payload));
        setComparison(extractComparison(payload));
        setSuggestions(extractSuggestions(payload));
        setActiveIndex(0);
        setLastQuery({ keyword, city, businessName, placeId });

        const rankedKeywords = normalized.filter((k) =>
          k.gridPoints.some((p) => p.businessFound),
        ).length;
        if (rankedKeywords === 0) {
          toast.error(
            `"${businessName}" isn't ranking at any grid point yet.`,
          );
        } else {
          toast.success(
            `Ranking for ${rankedKeywords} of ${normalized.length} keyword(s).`,
          );
        }
      } catch (err) {
        console.error("Rank fetch failed:", err);
        setError(err.message || "Something went wrong");
        toast.error("Could not fetch rank data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Active keyword's data — the whole existing UI reads these.
  const active = keywordResults[activeIndex] || null;
  const gridPoints = active?.gridPoints || [];
  const averagePosition = active?.averagePosition || null;
  const topCompetitors = active?.topCompetitors || [];

  const centerPoint =
    gridPoints.find((p) => p.isCenter) || gridPoints[0] || null;

  const summary = useMemo(() => computeSummary(gridPoints), [gridPoints]);

  const saveResult = useCallback(
    async ({
      userId,
      email,
      fullName,
      phone,
      plan,
      keyword,
      city,
      businessName,
      locationId,
      placeId,
      gridSize,
    }) => {
      if (!userId) {
        toast.error("Please log in to save (userId missing).");
        return null;
      }
      if (!gridPoints.length) {
        toast.error("Run an audit first, then save it.");
        return null;
      }

      setIsSaving(true);
      try {
        const res = await fetch(`${API_URL}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            fullName,
            phone,
            plan,
            // Save the currently viewed keyword.
            keyword: active?.keyword || keyword,
            city,
            businessName,
            locationId,
            placeId,
            gridSize,
            // Active keyword (backward-compat + quick compare)
            points: gridPoints,
            summary,
            averagePosition,
            topCompetitors,
            // Full updated audit — saare keywords + overall insights
            keywordResults,
            businessDetails,
            overallAveragePosition,
            overallTopCompetitors,
            comparison,
            suggestions,
          }),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          toast.error(result.message || "Save failed");
          return null;
        }

        toast.success("Audit saved! You can compare it later.");
        return result.data;
      } catch (err) {
        console.error("Save rank audit failed:", err);
        toast.error(err.message || "Could not save the audit.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [
      gridPoints,
      summary,
      averagePosition,
      topCompetitors,
      active,
      keywordResults,
      businessDetails,
      overallAveragePosition,
      overallTopCompetitors,
      comparison,
      suggestions,
    ],
  );

  const fetchSavedResults = useCallback(
    async ({ userId, keyword, businessName, gridSize } = {}) => {
      if (!userId) {
        toast.error("userId missing — cannot load saved audits.");
        return [];
      }

      setIsLoadingSaved(true);
      try {
        const params = new URLSearchParams({ userId });
        if (keyword) params.set("keyword", keyword);
        if (businessName) params.set("businessName", businessName);
        if (gridSize) params.set("gridSize", gridSize);

        const res = await fetch(`${API_URL}/save?${params.toString()}`);
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to load saved audits");
        }

        setSavedResults(result.data || []);
        return result.data || [];
      } catch (err) {
        console.error("Load saved audits failed:", err);
        toast.error(err.message || "Could not load saved audits.");
        return [];
      } finally {
        setIsLoadingSaved(false);
      }
    },
    [],
  );

  return {
    // Multi-keyword
    keywordResults,
    overallTopCompetitors,
    businessDetails,
    overallAveragePosition,
    comparison,
    suggestions,
    activeIndex,
    setActiveIndex,
    activeKeyword: active?.keyword || "",
    // Active keyword's derived data (existing UI uses these)
    gridPoints,
    centerPoint,
    summary,
    averagePosition,
    topCompetitors,
    isLoading,
    error,
    lastQuery,
    fetchRanks,
    // saving / comparison
    saveResult,
    isSaving,
    savedResults,
    fetchSavedResults,
    isLoadingSaved,
  };
}
