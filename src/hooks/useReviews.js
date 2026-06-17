"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { reviewService } from "@/services/reviewService";
import { getLocalStorage, isImpersonating } from "@/utils/storage";

const TOAST_POSITION = "top-center";

const normalizeGmbAccountId = (id) =>
  String(id || "").replace(/^accounts\//, "");

export function useReviews(session, status) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [locationAutoReply, setLocationAutoReply] = useState({});

  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  const userId = session?.user?.id || session?.user?.email;

  const handleAIReply = useCallback(
    async (
      review,
      setLocalReply,
      setShowReplyInput,
      setGeneratingAI,
      isAuto = false,
    ) => {
      try {
        if (setGeneratingAI) setGeneratingAI(true);
        const { name, reviewId, comment, starRating, reviewer } = review;
        const starRatingMap = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
        const [, accountId, , locationId] = name?.split("/") || [];

        if (!accessToken) throw new Error("Session expired.");

        const data = await reviewService.sendAIReply(
          accessToken,
          accountId,
          locationId,
          reviewer?.displayName || "Anonymous",
          starRatingMap[starRating] || 5,
          comment || "No comment provided",
          reviewId,
        );

        if (data.status === true) {
          if (!isAuto) {
            toast.success("AI reply sent!");
            if (setShowReplyInput) setShowReplyInput(false);
            if (setLocalReply) setLocalReply("");
          }
          return true;
        }
        throw new Error("AI reply failed");
      } catch (err) {
        if (!isAuto) toast.error(err.message);
        return false;
      } finally {
        if (setGeneratingAI) setGeneratingAI(false);
      }
    },
    [accessToken],
  );

  const fetchReviews = useCallback(
    async (
      isAutoMode = false,
      showSuccessToast = true,
      selectedLocationId = null,
    ) => {
      try {
        setLoading(true);
        const locationDetailsStr = getLocalStorage("locationDetails");
        
        // --- CHANGE 1: Silent return if no location details yet ---
        if (!locationDetailsStr) {
            setLoading(false);
            return; 
        }

        const locationDetails =
          typeof locationDetailsStr === "string"
            ? JSON.parse(locationDetailsStr)
            : locationDetailsStr;

        if (!accessToken) return; // Silent return if no token

        // --- FILTER LOGIC FOR SPECIFIC LOCATION ---
        let locationsToFetch = [];
        if (selectedLocationId && selectedLocationId !== "all") {
          const target = locationDetails.find(
            (l) => l.locationId === selectedLocationId,
          );
          if (target) locationsToFetch = [target];
        } else {
          locationsToFetch = locationDetails;
        }

        if (locationsToFetch.length === 0) return;

        // Grouping for API calls
        const groups = locationsToFetch.reduce((acc, loc) => {
          const accId = normalizeGmbAccountId(loc.accountId);
          if (!acc[accId]) acc[accId] = [];
          acc[accId].push(loc.locationId);
          return acc;
        }, {});

        // API Call execution
        const allReviews = (
          await Promise.all(
            Object.entries(groups).map(([accId, locIds]) =>
              reviewService.fetchAllReviews(accId, locIds, accessToken),
            ),
          )
        ).flat();

        const sortedReviews = allReviews
          .map((r) => ({ ...r, _timestamp: new Date(r.createTime).getTime() }))
          .sort((a, b) => b._timestamp - a._timestamp);

        setReviews(sortedReviews);
        setHasLoadedReviews(true);
        localStorage.setItem("cachedReviews", JSON.stringify(sortedReviews));

        if (showSuccessToast && !isAutoMode) {
          toast.success(`Loaded ${sortedReviews.length} reviews`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const handleLocationAutoReplyToggle = useCallback(
    async (accountId, locationId) => {
      const normalizedAccountId = normalizeGmbAccountId(accountId);
      const locationKey = `${normalizedAccountId}_${locationId}`;
      const currentState = locationAutoReply[locationKey] ?? false;
      const newState = !currentState;

      setLocationAutoReply((prev) => ({ ...prev, [locationKey]: newState }));

      try {
        const raw = getLocalStorage("locationDetails");
        const allLocations = raw ? JSON.parse(raw) : [];

        const singleLocation = allLocations.find(
          (loc) => loc.locationId === locationId,
        );

        if (!singleLocation) throw new Error("Location not found");

        const accountLocations = [
          {
            accountId: normalizedAccountId,
            locationId: singleLocation.locationId,
            title: singleLocation.title,
            categories: singleLocation.categories,
          },
        ];

        await reviewService.toggleAutoReply(
          userId,
          refreshToken,
          normalizedAccountId,
          accountLocations,
          newState,
        );

        toast.success(`Auto-reply ${newState ? "enabled" : "disabled"}`, {
          position: TOAST_POSITION,
        });
      } catch (err) {
        setLocationAutoReply((prev) => ({
          ...prev,
          [locationKey]: currentState,
        }));
        toast.error(err.message || "Failed to update auto-reply", {
          position: TOAST_POSITION,
        });
      }
    },
    [userId, refreshToken, locationAutoReply],
  );

  // Effect for Auto Reply Settings
  useEffect(() => {
    if (isImpersonating()) {
      const stateMap = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith("autoReply_")) continue;
        try {
          const { autoReply } = JSON.parse(window.localStorage.getItem(key));
          const withoutPrefix = key.slice("autoReply_".length);
          stateMap[withoutPrefix] = autoReply === true;
        } catch {
          // skip
        }
      }
      setLocationAutoReply(stateMap);
      return;
    }

    if (!userId) return;

    reviewService.getAutoReplySettings(userId).then((data) => {
      if (!data?.accounts) return;
      const stateMap = {};
      data.accounts.forEach((acc) => {
        const normalizedAccId = normalizeGmbAccountId(acc.accountId);
        (acc.locations || []).forEach((loc) => {
          stateMap[`${normalizedAccId}_${loc.locationId}`] = loc.autoReply === true;
        });
      });
      setLocationAutoReply(stateMap);
    });
  }, [userId]);

  // --- CHANGE 2: Naya Effect jo page load hote hi reviews layega ---
  useEffect(() => {
    if (status === "authenticated" && accessToken) {
      fetchReviews(true, false); 
    }
  }, [status, accessToken, fetchReviews]);

  return {
    reviews,
    loading,
    error,
    hasLoadedReviews,
    locationAutoReply,
    fetchReviews,
    handleAIReply,
    handleLocationAutoReplyToggle,
  };
}