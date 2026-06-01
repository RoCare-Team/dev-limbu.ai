import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { reviewService } from "@/services/reviewService";
import { getLocalStorage, setLocalStorage } from "@/utils/storage";

const TOAST_POSITION = "top-center";

const normalizeGmbAccountId = (accountId) =>
  String(accountId || "").replace(/^accounts\//, "");

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

function mapListingToLocation(item) {
  const locationId = item?.name?.split("/").pop();
  return {
    locationId,
    accountId: item.accountId || "",
    accountName: item.accountName || "",
    locality: item.storefrontAddress?.locality || "",
    address: item.storefrontAddress?.addressLines?.[0] || "",
    title: item.title || "",
    websiteUrl: item.websiteUri || "",
    reviewUri: item.metadata?.newReviewUri || "",
    isVerified: item.hasVoiceOfMerchant === true || item.verified === true,
    businessProfileId: item.name || "",
    name: item.name,
    websiteUri: item.websiteUri,
    storefrontAddress: item.storefrontAddress,
    phoneNumbers: item.phoneNumbers,
    categories: item.categories,
    openInfo: item.openInfo,
    metadata: item.metadata,
  };
}

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [locationAutoReply, setLocationAutoReply] = useState({});

  const getLocationDetails = useCallback(async () => {
    const locationDetailsStr = getLocalStorage("locationDetails");
    if (locationDetailsStr) {
      try {
        const parsed =
          typeof locationDetailsStr === "string"
            ? JSON.parse(locationDetailsStr)
            : locationDetailsStr;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (error) {
        console.error("Error parsing locationDetails:", error);
      }
    }

    const activeId = getActiveUserId();
    if (!activeId) throw new Error("USER_ID_MISSING");

    const res = await fetch(
      `/api/gmb/pages?userId=${encodeURIComponent(activeId)}&refresh=false`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || "LOCATION_NOT_FOUND");
    }

    const locations = (data.accounts || [])
      .flatMap((account) => account.listings || [])
      .map(mapListingToLocation)
      .filter((location) => location.locationId);

    if (locations.length > 0) {
      setLocalStorage("locationDetails", JSON.stringify(locations));
    }

    return locations;
  }, []);

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
        const userId = getActiveUserId();
        if (!userId) throw new Error("User ID not found. Please log in again.");

        const data = await reviewService.sendAIReply(
          userId,
          accountId,
          locationId,
          reviewer?.displayName || "Anonymous",
          starRatingMap[starRating] || 5,
          comment || "No comment provided",
          reviewId,
        );

        if (data.status === true) {
          if (!isAuto) {
            toast.success("AI reply sent successfully!", {
              duration: 3000,
              position: TOAST_POSITION,
            });
            if (setShowReplyInput) setShowReplyInput(false);
            if (setLocalReply) setLocalReply("");
          }
          return true;
        }

        throw new Error("AI reply generation failed");
      } catch (err) {
        console.error("AI Reply Error:", err);
        if (!isAuto) {
          toast.error(
            err.message || "Error generating AI reply. Please try manual reply.",
            { duration: 3000, position: TOAST_POSITION },
          );
        }
        return false;
      } finally {
        if (setGeneratingAI) setGeneratingAI(false);
      }
    },
    [],
  );

  const fetchReviews = useCallback(
    async (isAutoMode = false, showSuccessToast = true, selectedAccountId = null) => {
      try {
        setLoading(true);
        setError(null);

        const locationDetails = await getLocationDetails();
        if (!Array.isArray(locationDetails) || locationDetails.length === 0) {
          throw new Error("LOCATION_EMPTY");
        }

        const activeId = getActiveUserId();
        if (!activeId) throw new Error("USER_ID_MISSING");

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
              reviewService.fetchAllReviews(activeId, accountId, locationIds),
            ),
          )
        ).flat();

        const sortedReviews = allReviews
          .map((review) => ({
            ...review,
            _timestamp: new Date(review.createTime).getTime(),
          }))
          .sort((a, b) => b._timestamp - a._timestamp);

        if (isAutoMode) {
          const reviewsToAutoReply = sortedReviews.filter((review) => {
            const [, accountId] = review.name?.split("/") || [];
            const isAutoEnabled =
              locationAutoReply[normalizeGmbAccountId(accountId)] === true;
            const hasNoReply =
              !review.reviewReply?.comment ||
              review.reviewReply.comment.trim() === "";
            return isAutoEnabled && hasNoReply;
          });

          for (const review of reviewsToAutoReply) {
            await handleAIReply(review, null, null, null, true);
          }
          if (reviewsToAutoReply.length > 0) {
            toast.success("Auto-reply process complete. Refreshing review list.");
            setTimeout(() => fetchReviews(true, false), 2000);
          }
        }

        localStorage.setItem("cachedReviews", JSON.stringify(sortedReviews));
        localStorage.setItem("reviewsFetchedAt", Date.now().toString());

        setReviews(sortedReviews);
        setHasLoadedReviews(true);

        if (showSuccessToast && !isAutoMode) {
          toast.success(
            sortedReviews.length === 0
              ? "No reviews found for your locations"
              : `Successfully loaded ${sortedReviews.length} reviews`,
            {
              duration: 3000,
              position: TOAST_POSITION,
              id: sortedReviews.length === 0 ? "fetch-reviews-empty" : "fetch-reviews-success",
            },
          );
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.message);
        setHasLoadedReviews(true);

        if (!isAutoMode) {
          let userMessage = "Unable to load reviews. Please try again.";
          if (err.message === "LOCATION_NOT_FOUND" || err.message === "LOCATION_EMPTY") {
            userMessage = "Please set up your business location first.";
          } else if (err.message === "USER_ID_MISSING") {
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
    [getLocationDetails, handleAIReply, locationAutoReply],
  );

  const handleLocationAutoReplyToggle = useCallback(
    async (accountId) => {
      const currentUserId = getActiveUserId();
      const currentRefreshToken = getLocalStorage("refreshToken");

      if (!currentUserId) {
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
          .filter(
            (loc) =>
              normalizeGmbAccountId(loc?.accountId) === normalizedAccountId &&
              loc?.locationId,
          )
          .map((loc) => ({
            ...loc,
            accountId: normalizedAccountId,
            locationId: loc.locationId,
          }));
      } catch (err) {
        console.error("Error reading account locations for auto-reply:", err);
      }

      setLocationAutoReply((prev) => ({ ...prev, [normalizedAccountId]: newValue }));

      try {
        await reviewService.toggleAutoReply(
          currentUserId,
          currentRefreshToken,
          normalizedAccountId,
          accountLocations,
          newValue,
        );
        toast.success(
          `Auto Reply ${newValue ? "enabled" : "disabled"} for this GMB account`,
          { duration: 2000, position: TOAST_POSITION },
        );
      } catch (err) {
        console.error("Auto reply toggle error:", err);
        setLocationAutoReply((prev) => ({ ...prev, [normalizedAccountId]: current }));
        toast.error(err.message || "Failed to update auto-reply setting.");
      }
    },
    [locationAutoReply],
  );

  useEffect(() => {
    const currentUserId = getActiveUserId();
    if (!currentUserId) return;

    reviewService.getAutoReplySettings(currentUserId).then((data) => {
      if (data?.accounts?.length > 0) {
        const map = {};
        data.accounts.forEach((account) => {
          map[normalizeGmbAccountId(account.accountId)] = account.autoReply ?? false;
        });
        setLocationAutoReply(map);
      } else if (data?.locations?.length > 0) {
        const map = {};
        data.locations.forEach((loc) => {
          const aid = normalizeGmbAccountId(loc.accountId);
          map[aid] = map[aid] || loc.autoReply === true;
        });
        setLocationAutoReply(map);
      }
    });
  }, []);

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

    const currentUserId = getActiveUserId();
    if (currentUserId && !hasLoadedReviews) {
      fetchReviews(false, !hasCache);
    }

    const hasAnyAutoReply = Object.values(locationAutoReply).some(Boolean);
    let intervalId;
    if (hasAnyAutoReply && currentUserId) {
      intervalId = setInterval(() => fetchReviews(true, false), 5 * 60 * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasLoadedReviews, fetchReviews, locationAutoReply]);

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
