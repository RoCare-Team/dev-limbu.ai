"use client";
import { useState, useCallback } from "react";
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

  return {
    id: `${point.lat}_${point.lng}`,
    lat: point.lat,
    lng: point.lng,
    isCenter: !!point.isCenter,
    competitors,
    businessRank: point.rank ?? null,
    businessFound: point.rank != null,
  };
}

export function useRankTracker() {
  const [gridPoints, setGridPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);

  const fetchRanks = useCallback(async ({ keyword, city, businessName, gridSize, }) => {
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
       grid_size: gridSize,
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

const rawPoints = Array.isArray(result.data)
  ? result.data
  : result.data?.data;

if (!Array.isArray(rawPoints)) {
  throw new Error("Unexpected response shape from API");
}

      const normalized = rawPoints.map((p) => normalizePoint(p));
      setGridPoints(normalized);
      setLastQuery({ keyword, city, businessName });

      const rankedCount = normalized.filter((p) => p.businessFound).length;
      if (rankedCount === 0) {
        toast.error(`"${businessName}" isn't ranking in the top 3 at any grid point.`);
      } else {
        toast.success(`Ranking in top 3 at ${rankedCount} of ${normalized.length} points.`);
      }
    } catch (err) {
      console.error("Rank fetch failed:", err);
      setError(err.message || "Something went wrong");
      toast.error("Could not fetch rank data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const centerPoint = gridPoints.find((p) => p.isCenter) || gridPoints[0] || null;

  const summary = {
    totalPoints: gridPoints.length,
    rankedPoints: gridPoints.filter((p) => p.businessFound).length,
    bestRank: gridPoints.reduce((best, p) => {
      if (p.businessRank == null) return best;
      return best == null ? p.businessRank : Math.min(best, p.businessRank);
    }, null),
  };

  return {
    gridPoints,
    centerPoint,
    summary,
    isLoading,
    error,
    lastQuery,
    fetchRanks,
  };
}