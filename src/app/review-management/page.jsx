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
  MessageSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

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
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");
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
        throw new Error("No location details found in localStorage");
      }

      const locationDetails = JSON.parse(locationDetailsStr);

      const token = session?.accessToken;
      console.log("Session token exists:", !!token);

      if (!locationDetails || !Array.isArray(locationDetails) || locationDetails.length === 0) {
        throw new Error("Location details are empty or invalid");
      }

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const acc_id = locationDetails[0]?.accountId;
      const locationIds = locationDetails.map((loc) => loc.locationId).filter(Boolean);


      if (!acc_id) {
        throw new Error("Account ID is missing from location details");
      }

      if (locationIds.length === 0) {
        throw new Error("No valid location IDs found");
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
          throw new Error(`API request failed with status ${res.status}: ${errorText}`);
        }

        const data = await res.json();
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
            await handleAIReply(review, () => {}, () => {}, () => {}, true);
          }
          // After attempting all auto-replies, refresh the list to show the new replies
          toast.success("Auto-reply process complete. Refreshing review list.", { icon: '🔄' });
          // A short delay to allow backend processing before refetching
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
      toast.error(`Error: ${err.message}`, {
        duration: 5000,
        position: TOAST_POSITION,
      });
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
      console.log("Setting up auto-reply interval (5 minutes for testing)");
      // toast.success("Auto-reply mode is active. Checking for new reviews every 5 minutes for testing.", { icon: '🤖' });
      intervalId = setInterval(() => {
        console.log("Auto-reply interval triggered: fetching reviews.");
        fetchReviews(true);
      }, 5 * 60 * 1000); // 5 minutes for testing
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, session, hasLoadedReviews]);

  // Show support popup after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSupportPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto hide support popup after 5 seconds
  useEffect(() => {
    if (showSupportPopup) {
      const timer = setTimeout(() => {
        setShowSupportPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSupportPopup]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    
    const loadingToast = toast.loading("Submitting issue...");
    
    // Simulate API call
    setTimeout(() => {
        toast.success("Issue reported! We'll contact you shortly.", { id: loadingToast });
        setShowIssueModal(false);
        setIssueText("");
        setShowSupportPopup(false);
    }, 1500);
  };

  useEffect(() => {
    const plan = localStorage.getItem("Plan");
    const normalizedPlan = plan ? plan.trim() : null;
    setUserPlan(normalizedPlan);
    setCheckingPlan(false);
    
    console.log("User plan detected:", normalizedPlan);
  }, []);

  console.log("sessionsession",session);
  

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
          access_token: session?.accessToken,
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
        
        // The refresh is now handled in the fetchReviews function after the loop completes
      } else {
        toast.error("Failed to generate AI reply. Please try manual reply.", {
          duration: 3000,
          position: TOAST_POSITION,
        });
      }
    } catch (err) {
      console.error("AI Reply Error:", err);
      toast.error("Error generating AI reply. Please try manual reply.", {
        duration: 3000,
        position: TOAST_POSITION,
      });
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
      if (!localReply.trim()) return;

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
        
        const res = await fetch("https://n8n.srv968758.hstgr.cloud/webhook/45f3a8db-b8d2-46ec-b692-4ec5fe90acc7", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: session?.accessToken,
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
          toast.error("Failed to post reply. Please try again.", {
            duration: 3000,
            position: TOAST_POSITION,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Error posting reply. Please try again.", {
          duration: 3000,
          position: TOAST_POSITION,
        });
      } finally {
        setReplyingTo(null);
      }
    };

    return (
     <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Location Info Banner - Enhanced Design */}
        {locationInfo && (
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 mt-1">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-base sm:text-lg mb-1 truncate">
                  {locationInfo.title}
                </h4>
                <div className="flex items-start gap-1 sm:gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-100 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-50 leading-relaxed">
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
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md">
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
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
                    className="bg-white text-gray-700 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all w-full sm:w-auto"
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-sm"
                    rows="3"
                    disabled={isReplying}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <button
                      onClick={handleManualReply}
                      disabled={isReplying || !localReply?.trim()}
                      className="bg-blue-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </Link>
      </div>
      <Toaster />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 text-center">Customer Reviews</h1>
          <p className="text-gray-600 text-sm sm:text-lg text-center px-2 sm:px-4">
            Manage and respond to your Google Business reviews with AI assistance
          </p>
        </div>

        {loading && !hasLoadedReviews ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fetching Your Reviews</h2>
              <p className="text-gray-600">
                Please wait while we load all your customer reviews...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 p-8 rounded-2xl text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Reviews</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="space-y-4">
              <button
                onClick={fetchReviews}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Try Again
              </button>
              <div className="text-sm text-gray-600 max-w-2xl mx-auto">
                <p className="font-semibold mb-2">Troubleshooting tips:</p>
                <ul className="text-left space-y-1">
                  <li>• Check your browser console (F12) for detailed error logs</li>
                  <li>• Verify that location details are saved in localStorage</li>
                  <li>• Ensure you're properly authenticated with Google</li>
                  <li>• Try logging out and logging back in</li>
                </ul>
              </div>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl shadow-sm text-center border border-gray-100">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No reviews found</p>
            <p className="text-gray-400 text-sm mb-6">Your business doesn't have any reviews yet</p>
            <button
              onClick={fetchReviews}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Check Again
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
                    ${replyMode === 'auto' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gray-200 text-gray-800'}
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
                      <ToggleLeft className="w-7 h-7 text-gray-500" />
                    )}
                    {replyMode === 'auto' ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchReviews}
                disabled={loading}
                className="w-full sm:w-auto bg-white text-gray-700 px-5 py-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 text-base font-semibold shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
<p className="text-sm text-gray-700">
  <span className="font-bold">Note:</span> Auto Reply <span className="font-semibold">ON</span> will auto-fetch reviews and send AI replies.
  <br />
  Auto Reply <span className="font-semibold">OFF</span> means you will reply manually.
</p>


            <div className="text-right mb-8">
              <p className="text-gray-700 font-medium text-lg">
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
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border rounded-lg bg-white text-gray-600 hover:text-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                </button>
                <span className="text-gray-700 font-medium text-sm sm:text-base">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border rounded-lg bg-white text-gray-600 hover:text-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reopen Support Popup Button */}
      {!showSupportPopup && (
        <button
          onClick={() => setShowSupportPopup(true)}
          className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:scale-110 group animate-in fade-in zoom-in duration-300"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </button>
      )}

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-sm w-full animate-in slide-in-from-right fade-in duration-500">
          <div className="bg-white/95 backdrop-blur-md border border-blue-100 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
            <button 
              onClick={() => setShowSupportPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-4 items-start">
              <div className="bg-blue-50 p-3 rounded-full flex-shrink-0 animate-pulse">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Need Help?</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Facing any issues? Let us know and we'll fix it for you.
                </p>
                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => setShowIssueModal(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                    >
                    Report Issue
                    </button>
                    <a href="tel:9289344726" className="flex-1 inline-flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all whitespace-nowrap">
                        <Phone className="w-3 h-3" /> 9289344726
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
                    <p className="text-sm text-gray-500">We'll help you resolve it quickly.</p>
                </div>
            </div>

            <form onSubmit={handleIssueSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe the issue</label>
                    <textarea
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        placeholder="e.g., I cannot connect my GMB account..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] text-sm resize-none"
                        required
                    />
                </div>
                
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowIssueModal(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-sm flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit Ticket
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}