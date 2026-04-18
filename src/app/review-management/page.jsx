"use client";
import { useEffect, useState } from "react";
import {
  Loader2,
  Star,
  MessageCircle,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lock,
  Zap,
  RefreshCw,
  AlertCircle,
  Download,
  ToggleLeft,
  ToggleRight,
  Building2,
  MapPin,
  ArrowLeft,
  X,
  Phone,
  Info,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
// import SupportModal from "@/components/SupportModal";

const TOAST_POSITION = "top-center";

export default function DashboardPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userPlan, setUserPlan] = useState(null);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [error, setError] = useState(null);
  const [replyMode, setReplyMode] = useState("manual"); // 'manual' or 'auto'
  const reviewsPerPage = 5;

  const { data: session, status } = useSession();

  const router = useRouter();

  // Load reviews from localStorage on mount
  useEffect(() => {
    const savedReviews = localStorage.getItem("cachedReviews");
    const savedTimestamp = localStorage.getItem("reviewsFetchedAt");

    if (savedReviews) {
      try {
        const parsedReviews = JSON.parse(savedReviews);
        setReviews(parsedReviews);
        setHasLoadedReviews(true);
        console.log(`Loaded ${parsedReviews.length} cached reviews from localStorage`);

        if (savedTimestamp) {
          const fetchedDate = new Date(parseInt(savedTimestamp));
          console.log(`Reviews last fetched at: ${fetchedDate.toLocaleString()}`);
        }
      } catch (err) {
        console.error("Error parsing cached reviews:", err);
        localStorage.removeItem("cachedReviews");
        localStorage.removeItem("reviewsFetchedAt");
      }
    }
  }, []);

  const fetchReviews = async (isAutoMode = false) => {
    try {
      setLoading(true);
      setError(null);

      // Get location details from localStorage
      const locationDetailsStr = localStorage.getItem("locationDetails");
      console.log("Raw locationDetails from localStorage:", locationDetailsStr);

      if (!locationDetailsStr) {
        throw new Error("LOCATION_NOT_FOUND");
      }

      const locationDetails = JSON.parse(locationDetailsStr);

      // Get the access token from session
      const token = session?.accessToken;
      console.log("Session token exists:", !!token);

      if (!locationDetails || !Array.isArray(locationDetails) || locationDetails.length === 0) {
        throw new Error("LOCATION_EMPTY");
      }

      if (!token) {
        throw new Error("AUTH_TOKEN_MISSING");
      }

      const acc_id = locationDetails[0]?.accountId;
      const locationIds = locationDetails.map((loc) => loc.locationId).filter(Boolean);

      if (!acc_id) {
        throw new Error("ACCOUNT_ID_MISSING");
      }

      if (locationIds.length === 0) {
        throw new Error("LOCATION_IDS_MISSING");
      }

      let allReviews = [];
      let pageToken = null;
      let pageCount = 0;
      const maxPages = 10; // Safety limit to prevent infinite loops

      do {
        pageCount++;
        console.log(`Fetching reviews page ${pageCount}...`);

        const requestBody = {
          acc_id,
          locationIds,
          access_token: token,
          ...(pageToken && { pageToken })
        };

        const res = await fetch("https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error Response:", errorText);
          throw new Error(`API_ERROR_${res.status}`);
        }

        let data;
        try {
          const responseText = await res.text();
          if (!responseText || responseText.trim() === "") {
            console.warn("Empty response received from API, treating as no reviews");
            data = { reviews: [] };
          } else {
            data = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          throw new Error("API_PARSE_ERROR");
        }
        console.log("API Response:", data);

        if (data.reviews && Array.isArray(data.reviews)) {
          console.log(`Received ${data.reviews.length} reviews on page ${pageCount}`);
          allReviews = [...allReviews, ...data.reviews];
          pageToken = data.nextPageToken || null;
        } else {
          console.log("No reviews in response or invalid format");
          pageToken = null;
        }

        // Safety check to prevent infinite loops
        if (pageCount >= maxPages) {
          console.warn("Reached maximum page limit");
          break;
        }

      } while (pageToken);

      console.log(`Total reviews fetched: ${allReviews.length}`);

      // Sort reviews: latest first (by createTime)
      const sortedReviews = allReviews.sort((a, b) => {
        const dateA = new Date(a.createTime);
        const dateB = new Date(b.createTime);
        return dateB - dateA;
      });

      if (isAutoMode) {
        console.log("Running in auto-reply mode. Checking for reviews without replies.");
        const reviewsToAutoReply = sortedReviews.filter(
          (review) => !review.reviewReply || !review.reviewReply.comment || review.reviewReply.comment.trim() === ""
        );

        if (reviewsToAutoReply.length > 0) {
          toast.success(`${reviewsToAutoReply.length} new reviews found. Generating AI replies...`, { icon: '🤖' });
          for (const review of reviewsToAutoReply) {
            await handleAIReply(review, () => { }, () => { }, () => { }, true);
          }
          toast.success("Auto-reply process complete. Refreshing review list.", { icon: '🔄' });
          setTimeout(() => fetchReviews(), 2000);
        }
      }

      // Save reviews to localStorage
      localStorage.setItem("cachedReviews", JSON.stringify(sortedReviews));
      localStorage.setItem("reviewsFetchedAt", Date.now().toString());
      console.log("Reviews saved to localStorage");

      setReviews(sortedReviews);
      setHasLoadedReviews(true);

      if (sortedReviews.length === 0 && !isAutoMode) {
        toast.success("No reviews found for your locations", {
          duration: 3000,
          position: TOAST_POSITION,
        });
      } else if (!isAutoMode) {
        toast.success(`Successfully loaded ${sortedReviews.length} reviews`, {
          duration: 3000,
          position: TOAST_POSITION,
        });
      }

    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err.message);
      setHasLoadedReviews(true);

      // Don't show error toast in auto mode to avoid spamming
      if (!isAutoMode) {
        // User-friendly error messages
        let userMessage = "Unable to load reviews. Please try again.";

        if (err.message === "LOCATION_NOT_FOUND" || err.message === "LOCATION_EMPTY") {
          userMessage = "Please set up your business location first.";
        } else if (err.message === "AUTH_TOKEN_MISSING") {
          userMessage = "Session expired. Please log in again.";
        } else if (err.message === "ACCOUNT_ID_MISSING" || err.message === "LOCATION_IDS_MISSING") {
          userMessage = "Business information incomplete. Please reconfigure your location.";
        } else if (err.message.startsWith("API_ERROR")) {
          userMessage = "Server error. Please try again in a moment.";
        } else if (err.message === "API_PARSE_ERROR") {
          userMessage = "Received invalid data from server. Please try again.";
        }

        toast.error(userMessage, {
          duration: 5000,
          position: TOAST_POSITION,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch reviews when component mounts and session is ready
  useEffect(() => {
    if (status === "authenticated" && session?.accessToken && !hasLoadedReviews) {
      fetchReviews();
    }

    // Load reply mode from localStorage
    const savedMode = localStorage.getItem("reviewReplyMode") || "manual";
    setReplyMode(savedMode);

    // Setup interval for auto-reply
    let intervalId;
    if (savedMode === "auto" && status === "authenticated") {
      console.log("Setting up auto-reply interval (5 minutes)");
      intervalId = setInterval(() => {
        console.log("Auto-reply interval triggered: fetching reviews.");
        fetchReviews(true);
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, session, hasLoadedReviews]);

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  useEffect(() => {
    const plan = localStorage.getItem("Plan");
    const normalizedPlan = plan ? plan.trim() : null;
    setUserPlan(normalizedPlan);
    setCheckingPlan(false);

    console.log("User plan detected:", normalizedPlan);
  }, []);

  const handleReplyModeToggle = async () => {
    const newMode = replyMode === "manual" ? "auto" : "manual";

    // Get locations first to validate
    const locationsStr = localStorage.getItem("locationDetails");
    const locations = locationsStr ? JSON.parse(locationsStr) : null;

    if (!locations || locations.length === 0) {
      toast.error("No business locations found. Cannot enable Auto Reply.");
      return;
    }

    // Check if we have a refresh token to save (crucial for offline auto-reply)
    const tokenToSave = session?.refreshToken;

    // Optimistic update
    setReplyMode(newMode);
    localStorage.setItem("reviewReplyMode", newMode);

    try {
      const res = await fetch("/api/saveAutoReply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id || session?.user?.email,
          refreshToken: tokenToSave,
          locations: locations,
          autoReply: newMode === "auto"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success(`Auto Reply is now ${newMode.toUpperCase()}`);
    } catch (error) {
      console.error("Auto reply save error:", error);
      toast.error(error.message);
      // Revert state on error
      const revertedMode = newMode === "manual" ? "auto" : "manual";
      setReplyMode(revertedMode);
      localStorage.setItem("reviewReplyMode", revertedMode);
    }
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIdx = (currentPage - 1) * reviewsPerPage;
  const currentReviews = reviews.slice(startIdx, startIdx + reviewsPerPage);

  const StarRating = ({ rating }) => {
    const filled =
      rating === "FIVE" ? 5 : rating === "FOUR" ? 4 : rating === "THREE" ? 3 : rating === "TWO" ? 2 : 1;
    return (
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const handleAIReply = async (review, setLocalReply, setShowReplyInput, setGeneratingAI, isAuto = false) => {
    try {
      setGeneratingAI(true);

      const {
        name,
        reviewId,
        comment,
        starRating,
        reviewer
      } = review;

      const starRatingMap = {
        "FIVE": "Five",
        "FOUR": "Four",
        "THREE": "Three",
        "TWO": "Two",
        "ONE": "One"
      };

      const [, accountId, , locationId] = name?.split('/') || [];
      const token = session?.accessToken;

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      console.log("Sending AI Reply Request:", {
        accountId,
        locationId,
        reviewId,
        reviewerName: reviewer?.displayName,
        starRating: starRatingMap[starRating],
        comment
      });

      const res = await fetch("https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          acc_id: accountId,
          locationIds: locationId,
          Reviewer_Name: reviewer?.displayName || "Anonymous",
          Star_Rating: starRatingMap[starRating] || "Five",
          Review_Content: comment || "No comment provided",
          Review_ID: reviewId
        }),
      });

      const data = await res.json();

      console.log("AI Reply Response:", data);

      if (data.status === true) {
        if (!isAuto) {
          toast.success("AI reply sent successfully!", {
            duration: 3000,
            position: TOAST_POSITION,
          });
          if (setShowReplyInput) setShowReplyInput(false);
          if (setLocalReply) setLocalReply("");
          await fetchReviews();
        }
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
    } finally {
      setGeneratingAI(false);
    }
  };

  const ReviewCard = ({ review }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [localReply, setLocalReply] = useState("");
    const [generatingAI, setGeneratingAI] = useState(false);
    const isReplying = replyingTo === review.reviewId;

    // Get location details for this review
    const getLocationDetails = () => {
      try {
        const locationDetailsStr = localStorage.getItem("locationDetails");
        if (!locationDetailsStr) return null;

        const locationDetails = JSON.parse(locationDetailsStr);
        const [, , , locationId] = review.name?.split('/') || [];

        const location = locationDetails.find(loc => loc.locationId === locationId);
        return location;
      } catch (err) {
        console.error("Error getting location details:", err);
        return null;
      }
    };

    const locationInfo = getLocationDetails();

    const handleManualReply = async () => {
      if (!localReply.trim()) {
        toast.error("Please enter a reply message");
        return;
      }

      try {
        setReplyingTo(review.reviewId);

        const { name, reviewId, starRating, reviewer } = review;
        const starRatingMap = {
          "FIVE": "Five",
          "FOUR": "Four",
          "THREE": "Three",
          "TWO": "Two",
          "ONE": "One"
        };

        const [, accountId, , locationId] = name?.split('/') || [];
        const token = session?.accessToken;

        if (!token) {
          throw new Error("Session expired. Please log in again.");
        }

        const res = await fetch("https://n8n.srv968758.hstgr.cloud/webhook/45f3a8db-b8d2-46ec-b692-4ec5fe90acc7", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            acc_id: accountId,
            locationIds: locationId,
            Reviewer_Name: reviewer?.displayName || "Anonymous",
            Star_Rating: starRatingMap[starRating] || "Five",
            Review_Content: review.comment || "No comment provided",
            Review_ID: reviewId,
            reply_review: localReply
          }),
        });

        const data = await res.json();
        console.log("Manual Reply Response:", data);

        if (res.ok && data.status === true) {
          toast.success("Reply posted successfully!", {
            duration: 3000,
            position: TOAST_POSITION,
          });
          await fetchReviews();
          setShowReplyInput(false);
          setLocalReply("");
        } else {
          throw new Error(data.message || "Failed to post reply");
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Error posting reply. Please try again.", {
          duration: 3000,
          position: TOAST_POSITION,
        });
      } finally {
        setReplyingTo(null);
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Location Info Banner */}
        {locationInfo && (
          <div className="bg-lightPrimary px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 mt-1">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-dark text-base sm:text-lg mb-1 truncate">
                  {locationInfo.title}
                </h4>
                <div className="flex items-start gap-1 sm:gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-dark flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-darkt leading-relaxed">
                    {locationInfo.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            <div className="flex-shrink-0">
              {review.reviewer?.profilePhotoUrl ? (
                <img
                  src={review.reviewer.profilePhotoUrl}
                  alt={review.reviewer?.displayName}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-lightPrimary text-dark flex items-center justify-center font-bold text-lg sm:text-xl shadow-md">
                  {review.reviewer?.displayName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                {review.reviewer?.displayName || "Anonymous User"}
              </h3>
              <span className="text-xs sm:text-sm text-gray-400">
                {new Date(review.createTime).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>

              <StarRating rating={review.starRating} />
              <p className="text-gray-700 mt-2 text-sm sm:text-base">{review.comment || "No comment provided."}</p>

              {review.reviewReply && review.reviewReply.comment && review.reviewReply.comment.trim() !== "" && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold text-green-900 mb-1">Your Reply</p>
                  <p className="text-xs sm:text-sm text-green-800">{review.reviewReply.comment}</p>
                </div>
              )}

              {(!review.reviewReply || !review.reviewReply.comment || review.reviewReply.comment.trim() === "") && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => handleAIReply(review, setLocalReply, setShowReplyInput, setGeneratingAI)}
                    disabled={generatingAI || isReplying}
                    className="bg-lightPrimary text-dark text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {generatingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Reply
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="bg-white text-dark text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border-2 border-gray-300 hover:border-lightPrimary hover:text-lightPrimary transition-all w-full sm:w-auto"
                  >
                    <MessageCircle className="w-4 h-4 inline-block mr-2" />
                    Manual Reply
                  </button>
                </div>
              )}

              {showReplyInput && (
                <div className="mt-4">
                  <textarea
                    value={localReply}
                    onChange={(e) => setLocalReply(e.target.value)}
                    placeholder="Write your reply here..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lightPrimary focus:border-transparent resize-none text-xs sm:text-sm"
                    rows="3"
                    disabled={isReplying}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <button
                      onClick={handleManualReply}
                      disabled={isReplying || !localReply?.trim()}
                      className="bg-lightPrimary text-dark text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-lightPrimary transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                    >
                      {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                    <button
                      onClick={() => setShowReplyInput(false)}
                      className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all px-4 py-2 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (checkingPlan || status === "loading") {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-lightPrimary animate-spin mx-auto mb-4" />
          <p className="text-dark font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative">
      {/* Back button for mobile view */}
      <div className="sm:hidden fixed top-15 left-5 z-50">
        <Link href="/dashboard" passHref>
          <button
            aria-label="Go back to dashboard"
            className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </button>
        </Link>
      </div>
      <Toaster />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 pt-6">
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-dark mb-2 text-center">Customer Reviews</h1>
          <p className="text-dark text-sm sm:text-lg text-center px-2 sm:px-4">
            Manage & respond to your Google Business reviews with AI assistance
          </p>
        </div>

        {loading && !hasLoadedReviews ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <Loader2 className="w-16 h-16 text-dark animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Reviews</h2>
              <p className="text-dark">
                Please wait while we fetch your customer reviews...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className=" bg-fullLight border-2 border-gray-200 p-8 rounded-2xl text-center max-w-2xl mx-auto">
            <div className="bg-lightPrimary rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
              <Info className="w-10 h-10 text-dark" />
            </div>
            <h3 className="text-2xl font-bold text-dark mb-3">Unable to Load Reviews</h3>
            <p className="text-dark mb-6 text-lg">
              {error === "LOCATION_NOT_FOUND" || error === "LOCATION_EMPTY"
                ? "Please set up your business location to view reviews."
                : error === "AUTH_TOKEN_MISSING"
                  ? "Your session has expired. Please log in again."
                  : error === "ACCOUNT_ID_MISSING" || error === "LOCATION_IDS_MISSING"
                    ? "Business information is incomplete. Please reconfigure your location."
                    : error.startsWith("API_ERROR")
                      ? "We're having trouble connecting to the server. Please try again in a moment."
                      : error === "API_PARSE_ERROR"
                        ? "Received invalid data from the server. Please try again."
                        : "Something went wrong. Please try again."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => fetchReviews()}
                disabled={loading}
                className="bg-lightPrimary text-dark px-8 py-3 rounded-lg hover:from-gray-500 hover:to-yellow-300 transition-all inline-flex items-center gap-2 disabled:opacity-50 font-semibold text-lg shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Trying Again...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </>
                )}
              </button>
              {(error === "LOCATION_NOT_FOUND" || error === "LOCATION_EMPTY") && (
                <div>
                  <Link href="/dashboard">
                    <button className="bg-white text-gray-500 px-8 py-3 rounded-lg border-2 border-gray-600 hover:bg-gray-50 transition-all font-semibold text-lg">
                      Go to Dashboard
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-2xl shadow-sm text-center border border-gray-100 max-w-2xl mx-auto">
            <div className="bg-lightPrimary rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-dark" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reviews Yet</h3>
            <p className="text-dark text-lg mb-6">
              Your business doesn't have any customer reviews at the moment.
            </p>
            <button
              onClick={() => fetchReviews()}
              disabled={loading}
              className="bg-lightPrimary text-dark px-8 py-3 rounded-lg hover:from-fullLight hover:to-lightPrimary transition-all inline-flex items-center gap-2 disabled:opacity-50 font-semibold text-lg shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Check for Reviews
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
              {/* Auto-Reply Toggle Switch */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={handleReplyModeToggle}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-xl shadow-md transition-all duration-300 ease-in-out
                    ${replyMode === 'auto' ? 'bg-lightPrimary text-dark' : 'bg-gray-200 text-gray-800'}
                  `}
                >
                  <span className="font-bold text-base px-4">
                    Auto-Reply
                  </span>
                  <span className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm
                    ${replyMode === 'auto' ? 'bg-white/20' : 'bg-white shadow-inner'}
                  `}>
                    {replyMode === 'auto' ? (
                      <ToggleRight className="w-7 h-7 text-white" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-dark" />
                    )}
                    {replyMode === 'auto' ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchReviews()}
                disabled={loading}
                className="w-full sm:w-auto bg-white text-gray-700 px-5 py-3 rounded-xl border-2 border-gray-300 hover:border-dark hover:text-lightPrimary transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 text-base font-semibold shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>

            <div className="bg-dark border border-dark rounded-lg p-4 mb-6">
              <p className="text-sm text-white">
                <span className="font-bold">Note:</span> Auto Reply <span className="font-semibold">ON</span> will automatically fetch new reviews and send AI-generated replies.
                <br />
                Auto Reply <span className="font-semibold">OFF</span> means you will reply to reviews manually.
              </p>
            </div>

            <div className="text-right mb-8">
              <p className="text-dark font-medium text-lg">
                Showing {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-6">
              {currentReviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-10 px-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border rounded-lg bg-white text-gray-600 hover:text-dark hover:border-lightPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                </button>
                <span className="text-gray-700 font-medium text-sm sm:text-base">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border rounded-lg bg-white text-gray-600 hover:text-dark hover:border-lightPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919289344726"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-9 h-9 fill-white"
        >
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </div>
  );
}