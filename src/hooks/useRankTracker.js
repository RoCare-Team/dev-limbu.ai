"use client";
import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

const API_URL = "/api/local-rank";

/**
 * Normalizes a raw grid point from the webhook into something the map can use directly.
 *
 * IMPORTANT: the webhook already tells us the business's rank at this point via the
 * top-level `rank` field — it does NOT list your own business inside `competitors`
 * (that array is just the top few rivals). So we read `point.rank` directly instead
 * of trying to name-match your business inside competitors, which would always fail.
 */
function normalizePoint(point) {
  const competitors = point.competitors || [];

  // The webhook has used two shapes over time: a flat `rank` and, in the
  // grid_results payload, `businessRank`. Accept either.
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

/**
 * The webhook now answers with one entry per keyword:
 *   [{ keyword, business_name, business_average_position, grid_results: [...] }]
 * Older runs returned the grid points directly. Flatten both into grid points.
 */
function extractGridPoints(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (list.some((item) => Array.isArray(item?.grid_results))) {
    return list.flatMap((item) => item.grid_results || []);
  }
  return list;
}

/**
 * `business_average_position` from the webhook — the average rank across the
 * grid points where the business actually showed up. Older responses don't
 * carry it, so this returns null and the UI falls back to the computed stats.
 */
function extractAveragePosition(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const entry = list.find((item) => item?.business_average_position);
  if (!entry) return null;

  const avg = entry.business_average_position;
  return {
    averageRank:
      typeof avg.average_rank === "number" ? avg.average_rank : null,
    frequency: avg.frequency ?? 0,
    totalGridPoints: avg.total_grid_points ?? 0,
    businessName: entry.business_name || "",
  };
}

/**
 * `top_competitors` — the rivals ranked across the whole grid, with their
 * frequency/average rank. Absent on older responses.
 */
function extractTopCompetitors(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const entry = list.find((item) => Array.isArray(item?.top_competitors));
  if (!entry) return [];

  return entry.top_competitors.map((c) => ({
    rank: c.rank ?? null,
    name: c.name || "",
    score: c.score ?? null,
    frequency: c.frequency ?? 0,
    averageRank: typeof c.average_rank === "number" ? c.average_rank : null,
    rating: c.rating ?? null,
    reviews: c.reviews ?? 0,
  }));
}

/**
 * The UI talks in "3x3" but the webhook only wants the side length — "3x3" → 3.
 */
function toGridSide(gridSize) {
  const side = parseInt(String(gridSize || "").split("x")[0], 10);
  return Number.isFinite(side) ? side : 1;
}

export function useRankTracker() {
  const [gridPoints, setGridPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const [averagePosition, setAveragePosition] = useState(null);
  const [topCompetitors, setTopCompetitors] = useState([]);

  // Saving / comparison state
  const [isSaving, setIsSaving] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchRanks = useCallback(
    async ({ keyword, city, businessName, gridSize, placeId }) => {
      if (!keyword || !city || !businessName) {
        toast.error("Keyword, city and business name are all required.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keyword,
              city,
              bussiness_name: businessName,
              grid_size: toGridSide(gridSize),
              // The GBP place id lets the webhook match the business by id
              // instead of fuzzy name matching.
              place_id: placeId || "",
              placeId: placeId || "",
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

        const payload = Array.isArray(result.data)
          ? result.data
          : result.data?.data;
        const rawPoints = extractGridPoints(payload);

        if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
          throw new Error("Unexpected response shape from API");
        }

        const normalized = rawPoints.map((p) => normalizePoint(p));
        setGridPoints(normalized);
        setAveragePosition(extractAveragePosition(payload));
        setTopCompetitors(extractTopCompetitors(payload));
        setLastQuery({ keyword, city, businessName, placeId });

        const rankedCount = normalized.filter((p) => p.businessFound).length;
        if (rankedCount === 0) {
          toast.error(
            `"${businessName}" isn't ranking in the top 3 at any grid point.`,
          );
        } else {
          toast.success(
            `Ranking in top 3 at ${rankedCount} of ${normalized.length} points.`,
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

  const centerPoint =
    gridPoints.find((p) => p.isCenter) || gridPoints[0] || null;

  const summary = useMemo(
    () => ({
      totalPoints: gridPoints.length,
      rankedPoints: gridPoints.filter((p) => p.businessFound).length,
      bestRank: gridPoints.reduce((best, p) => {
        if (p.businessRank == null) return best;
        return best == null ? p.businessRank : Math.min(best, p.businessRank);
      }, null),
    }),
    [gridPoints],
  );

  /**
   * Save the currently loaded audit (grid + competitors + summary) to the DB
   * so it can be compared against future runs of the same keyword.
   */
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
            keyword,
            city,
            businessName,
            locationId,
            placeId,
            gridSize,
            points: gridPoints,
            summary,
            averagePosition,
            topCompetitors,
          }),
        });

        const result = await res.json();

        // Handled API outcomes (e.g. the 15-day duplicate block) come back as
        // success:false — show their message as a toast WITHOUT throwing, so
        // it doesn't trigger the dev "Console Error" overlay.
        if (!res.ok || !result.success) {
          toast.error(result.message || "Save failed");
          return null;
        }

        toast.success("Audit saved! You can compare it later.");
        return result.data;
      } catch (err) {
        // Only true network/parse failures land here.
        console.error("Save rank audit failed:", err);
        toast.error(err.message || "Could not save the audit.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [gridPoints, summary, averagePosition, topCompetitors],
  );

  /** Load previously saved audits (optionally filtered) for the comparison view. */
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
