import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { reviewService } from "@/services/reviewService";
import { getLocalStorage } from "@/utils/storage";

const TOAST_POSITION = "top-center";

export function useReviews(session, status) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [replyMode, setReplyMode] = useState("manual"); // 'manual' or 'auto'

  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  const userId = session?.user?.id || session?.user?.email;

  // Handle AI Reply Generation
  const handleAIReply = useCallback(
    async (review, setLocalReply, setShowReplyInput, setGeneratingAI, isAuto = false) => {
      try {
        if (setGeneratingAI) setGeneratingAI(true);

        const { name, reviewId, comment, starRating, reviewer } = review;
        const starRatingMap = { FIVE: "Five", FOUR: "Four", THREE: "Three", TWO: "Two", ONE: "One" };
        const [, accountId, , locationId] = name?.split("/") || [];

        if (!accessToken) {
          throw new Error("Session expired. Please log in again.");
        }

        const data = await reviewService.sendAIReply(
          accessToken,
          accountId,
          locationId,
          reviewer?.displayName || "Anonymous",
          starRatingMap[starRating] || "Five",
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
    async (isAutoMode = false, showSuccessToast = true) => {
      try {
        setLoading(true);
        setError(null);

        const locationDetailsStr = getLocalStorage("locationDetails");
        if (!locationDetailsStr) throw new Error("LOCATION_NOT_FOUND");

        let locationDetails;
        try {
          locationDetails = typeof locationDetailsStr === "string" ? JSON.parse(locationDetailsStr) : locationDetailsStr;
        } catch (e) {
          locationDetails = locationDetailsStr;
        }

        if (!locationDetails || !Array.isArray(locationDetails) || locationDetails.length === 0) {
          throw new Error("LOCATION_EMPTY");
        }

        if (!accessToken) {
          throw new Error("AUTH_TOKEN_MISSING");
        }

        const acc_id = locationDetails[0]?.accountId;
        const locationIds = locationDetails.map((loc) => loc.locationId).filter(Boolean);

        if (!acc_id) throw new Error("ACCOUNT_ID_MISSING");
        if (locationIds.length === 0) throw new Error("LOCATION_IDS_MISSING");

        const allReviews = await reviewService.fetchAllReviews(acc_id, locationIds, accessToken);

        // Sort reviews more efficiently
        const sortedReviews = allReviews
          .map((review) => ({
            ...review,
            _timestamp: new Date(review.createTime).getTime(),
          }))
          .sort((a, b) => b._timestamp - a._timestamp);

        if (isAutoMode) {
          const reviewsToAutoReply = sortedReviews.filter(
            (review) => !review.reviewReply || !review.reviewReply.comment || review.reviewReply.comment.trim() === ""
          );

          if (reviewsToAutoReply.length > 0) {
            toast.success(`${reviewsToAutoReply.length} new reviews found. Generating AI replies...`, { icon: "🤖" });
            for (const review of reviewsToAutoReply) {
              await handleAIReply(review, null, null, null, true);
            }
            toast.success("Auto-reply process complete. Refreshing review list.", { icon: "🔄" });
            setTimeout(() => fetchReviews(true, false), 2000);
          }
        }

        localStorage.setItem("cachedReviews", JSON.stringify(sortedReviews));
        localStorage.setItem("reviewsFetchedAt", Date.now().toString());

        setReviews(sortedReviews);
        setHasLoadedReviews(true);

        if (showSuccessToast && !isAutoMode) {
          if (sortedReviews.length === 0) {
            toast.success("No reviews found for your locations", { duration: 3000, position: TOAST_POSITION, id: "fetch-reviews-empty" });
          } else {
            toast.success(`Successfully loaded ${sortedReviews.length} reviews`, { duration: 3000, position: TOAST_POSITION, id: "fetch-reviews-success" });
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
    [accessToken, handleAIReply]
  );

  const handleReplyModeToggle = async () => {
    const newMode = replyMode === "manual" ? "auto" : "manual";
    const locationsStr = getLocalStorage("locationDetails");
    let locations;
    try {
      locations = typeof locationsStr === "string" ? JSON.parse(locationsStr) : locationsStr;
    } catch (e) {
      locations = locationsStr;
    }

    if (!locations || locations.length === 0) {
      toast.error("No business locations found. Cannot enable Auto Reply.");
      return;
    }

    setReplyMode(newMode);
    localStorage.setItem("reviewReplyMode", newMode);

    try {
      await reviewService.toggleAutoReply(userId, refreshToken, locations, newMode === "auto");
      toast.success(`Auto Reply is now ${newMode.toUpperCase()}`);
    } catch (error) {
      console.error("Auto reply save error:", error);
      toast.error(error.message);
      setReplyMode(replyMode);
      localStorage.setItem("reviewReplyMode", replyMode);
    }
  };

  // Initial load and interval setup
  useEffect(() => {
    const cachedStr = getLocalStorage("cachedReviews");
    let hasCache = false;
    if (cachedStr) {
      try {
        const parsed = typeof cachedStr === "string" ? JSON.parse(cachedStr) : cachedStr;
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

    const savedMode = localStorage.getItem("reviewReplyMode") || "manual";
    setReplyMode(savedMode);

    let intervalId;
    if (savedMode === "auto" && status === "authenticated") {
      intervalId = setInterval(() => fetchReviews(true, false), 5 * 60 * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, accessToken, hasLoadedReviews, fetchReviews]);

  return {
    reviews,
    loading,
    error,
    replyMode,
    hasLoadedReviews,
    fetchReviews,
    handleAIReply,
    handleReplyModeToggle,
  };
}