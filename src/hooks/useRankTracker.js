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

  // Saving / comparison state
  const [isSaving, setIsSaving] = useState(false);
  const [savedResults, setSavedResults] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchRanks = useCallback(
    async ({ keyword, city, businessName, gridSize }) => {
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
            gridSize,
            points: gridPoints,
            summary,
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
    [gridPoints, summary],
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
