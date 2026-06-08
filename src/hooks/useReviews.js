import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { reviewService } from "@/services/reviewService";
import { getLocalStorage } from "@/utils/storage";

const TOAST_POSITION = "top-center";

const normalizeGmbAccountId = (accountId) =>
  String(accountId || "").replace(/^accounts\//, "");

export function useReviews(session, status) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);

  // Per-GMB-account autoReply state: { [accountId]: boolean }
  const [locationAutoReply, setLocationAutoReply] = useState({});

  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  const userId = session?.user?.id || session?.user?.email;

  // Handle AI Reply Generation
  const handleAIReply = useCallback(
    async (review, setLocalReply, setShowReplyInput, setGeneratingAI, isAuto = false) => {
      try {
        if (setGeneratingAI) setGeneratingAI(true);

        const { name, reviewId, comment, starRating, reviewer } = review;
        const starRatingMap = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
        const [, accountId, , locationId] = name?.split("/") || [];

        if (!accessToken) {
          throw new Error("Session expired. Please log in again.");
        }

        const data = await reviewService.sendAIReply(
          accessToken,
          accountId,
          locationId,
          reviewer?.displayName || "Anonymous",
          starRatingMap[starRating] || 5,
          comment || "No comment provided",
          reviewId
        );

        if (data.status === true) {
          if (!isAuto) {
            toast.success("AI reply sent successfully!", { duration: 3000, position: TOAST_POSITION });
            if (setShowReplyInput) setShowReplyInput(false);
            if (setLocalReply) setLocalReply("");
          }
          return true;
        } else {
          throw new Error("AI reply generation failed");
        }
      } catch (err) {
        console.error("AI Reply Error:", err);
        if (!isAuto) {
          toast.error(err.message || "Error generating AI reply. Please try manual reply.", {
            duration: 3000,
            position: TOAST_POSITION,
          });
        }
        return false;
      } finally {
        if (setGeneratingAI) setGeneratingAI(false);
      }
    },
    [accessToken]
  );

  const fetchReviews = useCallback(
    async (isAutoMode = false, showSuccessToast = true, selectedAccountId = null) => {
      try {
        setLoading(true);
        setError(null);

        const locationDetailsStr = getLocalStorage("locationDetails");
        if (!locationDetailsStr) throw new Error("LOCATION_NOT_FOUND");

        let locationDetails;
        try {
          locationDetails =
            typeof locationDetailsStr === "string"
              ? JSON.parse(locationDetailsStr)
              : locationDetailsStr;
        } catch (e) {
          locationDetails = locationDetailsStr;
        }

        if (!locationDetails || !Array.isArray(locationDetails) || locationDetails.length === 0) {
          throw new Error("LOCATION_EMPTY");
        }

        if (!accessToken) throw new Error("AUTH_TOKEN_MISSING");

        const normalizedSelectedAccountId = normalizeGmbAccountId(selectedAccountId);
        const locationsByAccount = locationDetails.reduce((acc, loc) => {
          const accountId = normalizeGmbAccountId(loc?.accountId);
          if (!accountId || !loc?.locationId) return acc;
          if (normalizedSelectedAccountId && accountId !== normalizedSelectedAccountId) return acc;
          if (!acc[accountId]) acc[accountId] = [];
          acc[accountId].push(loc.locationId);
          return acc;
        }, {});

        const accountEntries = Object.entries(locationsByAccount);

        if (accountEntries.length === 0) throw new Error("ACCOUNT_ID_MISSING");

        const allReviews = (
          await Promise.all(
            accountEntries.map(([accountId, locationIds]) =>
              reviewService.fetchAllReviews(accountId, locationIds, accessToken)
            )
          )
        ).flat();

        const sortedReviews = allReviews
          .map((review) => ({
            ...review,
            _timestamp: new Date(review.createTime).getTime(),
          }))
          .sort((a, b) => b._timestamp - a._timestamp);

        // Auto-reply: only reply for GMB accounts where autoReply is enabled
        if (isAutoMode) {
          const reviewsToAutoReply = sortedReviews.filter((review) => {
            const [, accountId] = review.name?.split("/") || [];
            const isAutoEnabled = locationAutoReply[normalizeGmbAccountId(accountId)] === true;
            const hasNoReply =
              !review.reviewReply ||
              !review.reviewReply.comment ||
              review.reviewReply.comment.trim() === "";
            return isAutoEnabled && hasNoReply;
          });

          if (reviewsToAutoReply.length > 0) {
            toast.success(
              `${reviewsToAutoReply.length} new reviews found. Generating AI replies...`,
              { icon: "🤖" }
            );
            for (const review of reviewsToAutoReply) {
              await handleAIReply(review, null, null, null, true);
            }
            toast.success("Auto-reply process complete. Refreshing review list.", { icon: "🔄" });
            setTimeout(() => fetchReviews(true, false), 2000);
          }
        }

        // Clear cache and update state
        localStorage.setItem("cachedReviews", JSON.stringify(sortedReviews));
        localStorage.setItem("reviewsFetchedAt", Date.now().toString());

        setReviews(sortedReviews);
        setHasLoadedReviews(true);

        if (showSuccessToast && !isAutoMode) {
          if (sortedReviews.length === 0) {
            toast.success("No reviews found for your locations", {
              duration: 3000,
              position: TOAST_POSITION,
              id: "fetch-reviews-empty",
            });
          } else {
            toast.success(`Successfully loaded ${sortedReviews.length} reviews`, {
              duration: 3000,
              position: TOAST_POSITION,
              id: "fetch-reviews-success",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.message);
        setHasLoadedReviews(true);

        if (!isAutoMode) {
          let userMessage = "Unable to load reviews. Please try again.";
          if (err.message === "LOCATION_NOT_FOUND" || err.message === "LOCATION_EMPTY") {
            userMessage = "Please set up your business location first.";
          } else if (err.message === "AUTH_TOKEN_MISSING") {
            userMessage = "Session expired. Please log in again.";
          } else if (err.message === "ACCOUNT_ID_MISSING" || err.message === "LOCATION_IDS_MISSING") {
            userMessage = "Business information incomplete.";
          } else if (err.message.startsWith("API_ERROR")) {
            userMessage = "Server error. Please try again in a moment.";
          }
          toast.error(userMessage, { duration: 5000, position: TOAST_POSITION });
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, handleAIReply, locationAutoReply]
  );

  /**
   * Toggle autoReply for one connected GMB account.
   */
  const handleLocationAutoReplyToggle = useCallback(
    async (accountId) => {
      if (!userId) {
        toast.error("Please log in to change auto-reply settings.");
        return;
      }

      const normalizedAccountId = normalizeGmbAccountId(accountId);
      const current = locationAutoReply[normalizedAccountId] ?? false;
      const newValue = !current;
      const locationDetailsStr = getLocalStorage("locationDetails");
      let accountLocations = [];

      try {
        const parsed =
          typeof locationDetailsStr === "string"
            ? JSON.parse(locationDetailsStr)
            : locationDetailsStr;
        accountLocations = (Array.isArray(parsed) ? parsed : [parsed])
          .filter((loc) => normalizeGmbAccountId(loc?.accountId) === normalizedAccountId && loc?.locationId)
          .map((loc) => ({
            ...loc,
            accountId: normalizedAccountId,
            locationId: loc.locationId,
          }));
      } catch (err) {
        console.error("Error reading account locations for auto-reply:", err);
      }

      // Optimistic UI update
      setLocationAutoReply((prev) => ({ ...prev, [normalizedAccountId]: newValue }));

      try {
        await reviewService.toggleAutoReply(userId, refreshToken, normalizedAccountId, accountLocations, newValue);
        toast.success(
          `Auto Reply ${newValue ? "enabled" : "disabled"} for this GMB account`,
          { duration: 2000, position: TOAST_POSITION }
        );
      } catch (err) {
        console.error("Auto reply toggle error:", err);
        // Revert on failure
        setLocationAutoReply((prev) => ({ ...prev, [normalizedAccountId]: current }));
        toast.error(err.message || "Failed to update auto-reply setting.");
      }
    },
    [userId, refreshToken, locationAutoReply]
  );

  // Load per-GMB-account autoReply settings from DB on mount
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    reviewService.getAutoReplySettings(userId).then((data) => {
      if (data?.accounts?.length > 0) {
        const map = {};
        data.accounts.forEach((account) => {
          map[normalizeGmbAccountId(account.accountId)] = account.autoReply ?? false;
        });
        setLocationAutoReply(map);
      } else if (data?.locations?.length > 0) {
        const map = {};
        data.locations.forEach((loc) => {
          const accountId = normalizeGmbAccountId(loc.accountId);
          map[accountId] = map[accountId] || loc.autoReply === true;
        });
        setLocationAutoReply(map);
      }
    });
  }, [status, userId]);

  // Load cached reviews + start auto-interval
  useEffect(() => {
    const cachedStr = getLocalStorage("cachedReviews");
    let hasCache = false;

    if (cachedStr) {
      try {
        const parsed =
          typeof cachedStr === "string" ? JSON.parse(cachedStr) : cachedStr;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
          setHasLoadedReviews(true);
          hasCache = true;
        }
      } catch (err) {
        console.error("Error parsing cached reviews", err);
      }
    }

    if (status === "authenticated" && accessToken && !hasLoadedReviews) {
      fetchReviews(false, !hasCache);
    }

    // Auto-interval: check every 5 min, but only runs if at least one account has autoReply on
    const hasAnyAutoReply = Object.values(locationAutoReply).some(Boolean);
    let intervalId;

    if (hasAnyAutoReply && status === "authenticated") {
      intervalId = setInterval(() => fetchReviews(true, false), 5 * 60 * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, accessToken, hasLoadedReviews, fetchReviews, locationAutoReply]);

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
