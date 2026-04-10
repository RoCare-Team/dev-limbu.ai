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
  User,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

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
        console.log(
          `Loaded ${parsedReviews.length} cached reviews from localStorage`,
        );

        if (savedTimestamp) {
          const fetchedDate = new Date(parseInt(savedTimestamp));
          console.log(
            `Reviews last fetched at: ${fetchedDate.toLocaleString()}`,
          );
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

      if (
        !locationDetails ||
        !Array.isArray(locationDetails) ||
        locationDetails.length === 0
      ) {
        throw new Error("LOCATION_EMPTY");
      }

      if (!token) {
        throw new Error("AUTH_TOKEN_MISSING");
      }

      const acc_id = locationDetails[0]?.accountId;
      const locationIds = locationDetails
        .map((loc) => loc.locationId)
        .filter(Boolean);

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
          ...(pageToken && { pageToken }),
        };

        const res = await fetch(
          "https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error Response:", errorText);
          throw new Error(`API_ERROR_${res.status}`);
        }

        let data;
        try {
          const responseText = await res.text();
          if (!responseText || responseText.trim() === "") {
            console.warn(
              "Empty response received from API, treating as no reviews",
            );
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
          console.log(
            `Received ${data.reviews.length} reviews on page ${pageCount}`,
          );
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
        console.log(
          "Running in auto-reply mode. Checking for reviews without replies.",
        );
        const reviewsToAutoReply = sortedReviews.filter(
          (review) =>
            !review.reviewReply ||
            !review.reviewReply.comment ||
            review.reviewReply.comment.trim() === "",
        );

        if (reviewsToAutoReply.length > 0) {
          toast.success(
            `${reviewsToAutoReply.length} new reviews found. Generating AI replies...`,
            { icon: "🤖" },
          );
          for (const review of reviewsToAutoReply) {
            await handleAIReply(
              review,
              () => {},
              () => {},
              () => {},
              true,
            );
          }
          toast.success(
            "Auto-reply process complete. Refreshing review list.",
            { icon: "🔄" },
          );
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

        if (
          err.message === "LOCATION_NOT_FOUND" ||
          err.message === "LOCATION_EMPTY"
        ) {
          userMessage = "Please set up your business location first.";
        } else if (err.message === "AUTH_TOKEN_MISSING") {
          userMessage = "Session expired. Please log in again.";
        } else if (
          err.message === "ACCOUNT_ID_MISSING" ||
          err.message === "LOCATION_IDS_MISSING"
        ) {
          userMessage =
            "Business information incomplete. Please reconfigure your location.";
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
    if (
      status === "authenticated" &&
      session?.accessToken &&
      !hasLoadedReviews
    ) {
      fetchReviews();
    }

    // Load reply mode from localStorage
    const savedMode = localStorage.getItem("reviewReplyMode") || "manual";
    setReplyMode(savedMode);

    // Setup interval for auto-reply
    let intervalId;
    if (savedMode === "auto" && status === "authenticated") {
      console.log("Setting up auto-reply interval (5 minutes)");
      intervalId = setInterval(
        () => {
          console.log("Auto-reply interval triggered: fetching reviews.");
          fetchReviews(true);
        },
        5 * 60 * 1000,
      ); // 5 minutes
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
          autoReply: newMode === "auto",
        }),
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
      rating === "FIVE"
        ? 5
        : rating === "FOUR"
          ? 4
          : rating === "THREE"
            ? 3
            : rating === "TWO"
              ? 2
              : 1;
    return (
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={`${i < filled ? "text-lemon-hover fill-lemon-hover" : "text-slate-100 fill-slate-100"}`}
          />
        ))}
      </div>
    );
  };

  const handleAIReply = async (
    review,
    setLocalReply,
    setShowReplyInput,
    setGeneratingAI,
    isAuto = false,
  ) => {
    try {
      setGeneratingAI(true);

      const { name, reviewId, comment, starRating, reviewer } = review;

      const starRatingMap = {
        FIVE: "Five",
        FOUR: "Four",
        THREE: "Three",
        TWO: "Two",
        ONE: "One",
      };

      const [, accountId, , locationId] = name?.split("/") || [];
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
        comment,
      });

      const res = await fetch(
        "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            acc_id: accountId,
            locationIds: locationId,
            Reviewer_Name: reviewer?.displayName || "Anonymous",
            Star_Rating: starRatingMap[starRating] || "Five",
            Review_Content: comment || "No comment provided",
            Review_ID: reviewId,
          }),
        },
      );

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
        toast.error(
          err.message || "Error generating AI reply. Please try manual reply.",
          {
            duration: 3000,
            position: TOAST_POSITION,
          },
        );
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
        const [, , , locationId] = review.name?.split("/") || [];

        const location = locationDetails.find(
          (loc) => loc.locationId === locationId,
        );
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
          FIVE: "Five",
          FOUR: "Four",
          THREE: "Three",
          TWO: "Two",
          ONE: "One",
        };

        const [, accountId, , locationId] = name?.split("/") || [];
        const token = session?.accessToken;

        if (!token) {
          throw new Error("Session expired. Please log in again.");
        }

        const res = await fetch(
          "https://n8n.srv968758.hstgr.cloud/webhook/45f3a8db-b8d2-46ec-b692-4ec5fe90acc7",
          {
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
              reply_review: localReply,
            }),
          },
        );

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
      <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden border border-black/5">
        {/* Location Info Banner */}
        {locationInfo && (
          <div className="bg-black px-4 sm:px-6 py-2.5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-lemon-glow rounded-lg">
                  <Building2 className="w-3 h-3 text-black" />
                </div>
                <h4 className="font-bold text-white text-[10px] uppercase tracking-tight truncate max-w-[150px] sm:max-w-md" style={{ fontFamily: "var(--font-heading)" }}>
                  {locationInfo.title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-lemon-glow/70 uppercase tracking-widest">
                <MapPin className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">{locationInfo.locality}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="flex-shrink-0">
              <div className="relative">
                {review.reviewer?.profilePhotoUrl ? (
                  <img
                    src={review.reviewer.profilePhotoUrl}
                    alt={review.reviewer?.displayName}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border border-black/5 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-black/5 flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 text-slate-200" />
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-lg border border-black/5 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Maps_icon.svg" className="w-3.5 h-3.5" alt="GMB" />
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-black text-sm sm:text-base uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                    {review.reviewer?.displayName || "Verified User"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(review.createTime).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Verified Feed</span>
                  </div>
                </div>
                <StarRating rating={review.starRating} />
              </div>

              <div className="bg-slate-50/50 border border-black/5 p-4 rounded-xl mb-6 transition-all hover:bg-white">
                <p className="text-slate-600 font-medium leading-relaxed text-xs sm:text-sm italic">
                  "{review.comment || "The customer provided a rating without a written statement."}"
                </p>
              </div>

              {review.reviewReply &&
                review.reviewReply.comment &&
                review.reviewReply.comment.trim() !== "" && (
                  <div className="bg-lemon-glow/5 border border-lemon-glow/10 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-lemon-hover" />
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-lemon-hover" />
                      <p className="text-[9px] font-black text-lemon-hover uppercase tracking-widest">AI Response Deployed</p>
                    </div>
                    <p className="text-slate-600 text-xs font-bold leading-relaxed">
                      {review.reviewReply.comment}
                    </p>
                  </div>
                )}

              {(!review.reviewReply ||
                !review.reviewReply.comment ||
                review.reviewReply.comment.trim() === "") && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() =>
                      handleAIReply(
                        review,
                        setLocalReply,
                        setShowReplyInput,
                        setGeneratingAI,
                      )
                    }
                    disabled={generatingAI || isReplying}
                    className="btn-lemon px-5 py-3 rounded-xl gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial text-[10px] uppercase tracking-widest"
                  >
                    {generatingAI ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate AI Reply
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="btn-ghost px-5 py-3 rounded-xl gap-2 flex-1 sm:flex-initial text-[10px] uppercase tracking-widest"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Manual Response
                  </button>
                </div>
              )}

              {showReplyInput && (
                <div className="mt-6 space-y-4 animate-slideInUp">
                  <div className="relative">
                    <textarea
                      value={localReply}
                      onChange={(e) => setLocalReply(e.target.value)}
                      placeholder="Type your professional response..."
                      className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border border-black/5 text-xs font-medium outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                      disabled={isReplying}
                    />
                    <div className="absolute top-3 right-3 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                      {localReply.length} Characters
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleManualReply}
                      disabled={isReplying || !localReply?.trim()}
                      className="btn-lemon px-8 py-3 rounded-xl gap-2 disabled:opacity-50 flex-1 sm:flex-initial text-[10px] uppercase tracking-widest"
                    >
                      {isReplying ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Send Reply ↗
                    </button>
                    <button
                      onClick={() => setShowReplyInput(false)}
                      className="btn-ghost px-6 py-3 rounded-xl flex-1 sm:flex-initial text-[10px] uppercase tracking-widest"
                    >
                      Discard
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
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="text-center relative z-10">
          <Loader2 className="w-10 h-10 text-lemon-hover animate-spin mx-auto mb-6" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">Accessing Review Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position={TOAST_POSITION} />

      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="w-full px-4 sm:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Reputation <span className="text-lemon-hover">Manager</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Social Intelligence Feed</p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
               {/* Auto-Reply Mode Control */}
               <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-black/5">
                 <button
                    onClick={() => replyMode === "auto" && handleReplyModeToggle()}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${replyMode === "manual" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black"}`}
                 >
                   Manual
                 </button>
                 <button
                    onClick={() => replyMode === "manual" && handleReplyModeToggle()}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${replyMode === "auto" ? "bg-lemon-glow text-black shadow-sm" : "text-slate-400 hover:text-black"}`}
                 >
                   <Zap className={`w-3 h-3 ${replyMode === "auto" ? "fill-black" : ""}`} />
                   AI Auto
                 </button>
               </div>

               <button
                onClick={() => fetchReviews()}
                disabled={loading}
                className="btn-ghost px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {loading && !hasLoadedReviews ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] opacity-50">
            <Loader2 className="w-12 h-12 text-black animate-spin mb-6" />
            <h2 className="text-[10px] font-black text-black uppercase tracking-widest">Synchronizing Stream...</h2>
          </div>
        ) : error ? (
          <div className="bg-white border border-black/5 p-10 rounded-[2.5rem] text-center max-w-lg mx-auto shadow-2xl">
            <div className="bg-red-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Access <span className="text-red-500">Denied</span>
            </h3>
            <p className="text-slate-500 font-medium mb-8 text-[11px] leading-relaxed">
              {error === "LOCATION_NOT_FOUND" || error === "LOCATION_EMPTY"
                ? "Deploy your business locations to analyze customer feedback."
                : "We encountered an intelligence gap. Please re-authenticate."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => fetchReviews()}
                disabled={loading}
                className="btn-lemon px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px]"
              >
                Retry Link ↗
              </button>
              <Link href="/dashboard" className="btn-ghost px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px]">
                Return Hub
              </Link>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-black/5 p-16 rounded-[3rem] text-center max-w-lg mx-auto shadow-2xl">
            <div className="bg-slate-50 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-black/5">
              <MessageCircle className="w-10 h-10 text-slate-100" />
            </div>
            <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Stream <span className="text-slate-300">Quiet</span></h3>
            <p className="text-slate-400 font-medium mb-8 text-[11px]">
              No entries found. Deploy your Magic QR to start capturing feedback. 
            </p>
            <button
              onClick={() => fetchReviews()}
              disabled={loading}
              className="btn-lemon px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[9px]"
            >
              Force Sync ↗
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Context Notice */}
            {replyMode === "auto" && (
              <div className="bg-black text-white p-6 rounded-[2rem] border border-lemon-glow/20 shadow-2xl flex items-start gap-4 animate-slideInRight">
                <div className="p-2.5 bg-lemon-glow rounded-xl shrink-0">
                  <Zap className="w-4 h-4 text-black fill-black" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-lemon-glow mb-1">AI Autopilot Active</p>
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                    Limbu AI is monitoring your locations. New entries will be analyzed and replied to autonomously using your brand's unique signature.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-black/5 pb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Live Feed: {reviews.length} entries detected
                </p>
              </div>
              <p className="text-[8px] font-black text-black uppercase tracking-widest">
                Segment {currentPage} / {totalPages}
              </p>
            </div>

            <div className="grid gap-8">
              {currentReviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pb-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost p-2.5 rounded-xl disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-9 h-9 rounded-xl text-[9px] font-black transition-all border ${currentPage === idx + 1 ? "bg-black text-lemon-glow border-black shadow-lg" : "bg-white text-slate-400 border-black/5 hover:border-black/20"}`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="btn-ghost p-2.5 rounded-xl disabled:opacity-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SupportModal showToast={showToast} />
    </div>
  );
}
