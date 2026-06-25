"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  ChevronLeft,
  Search,
  Filter,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import ReviewCard from "@/components/review-management/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import WhatsAppButton from "@/components/WhatsAppButton";

const TOAST_POSITION = "top-center";
const REVIEWS_PER_PAGE = 5;
const MAX_VISIBLE_PAGE_BUTTONS = 10;
const ALL_LOCATIONS = "all";

// Helper to extract location ID from GMB review name
const getReviewLocationId = (review) => review?.name?.split("/")?.[3];

const isUnrepliedReview = (review) =>
  !review?.reviewReply?.comment || review.reviewReply.comment.trim() === "";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const {
    reviews,
    loading,
    error,
    hasLoadedReviews,
    locationAutoReply,
    fetchReviews,
    handleAIReply,
    handleLocationAutoReplyToggle,
  } = useReviews(session, status);

  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState(ALL_LOCATIONS);
  
  // Safe Client-side only states
  const [locationOptions, setLocationOptions] = useState([]);
  const [searchInput, setSearchInput] = useState("All Locations");
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");

  // Fetch individual locations from localStorage safely on mount (Next.js Hydration safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (raw) {
        const parsed = JSON.parse(raw);
        setLocationOptions(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch (err) {
      console.error("Error reading locations:", err);
    }
  }, []);

  const selectedLocationLabel = useMemo(() => {
    if (selectedLocationId === ALL_LOCATIONS) return "All Locations";
    const found = locationOptions.find(
      (loc) => loc.locationId === selectedLocationId,
    );
    return found ? found.title : "Selected Location";
  }, [locationOptions, selectedLocationId]);

  // Keep search input in sync with the selection label
  useEffect(() => {
    setSearchInput(selectedLocationLabel);
  }, [selectedLocationLabel]);

  // Filter locations safely (handling potential null/undefined values)
  const filteredLocationOptions = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return locationOptions;
    return locationOptions.filter((loc) => {
      const title = (loc.title || "").toLowerCase();
      const locality = (loc.locality || "").toLowerCase();
      return title.includes(query) || locality.includes(query);
    });
  }, [locationOptions, searchInput]);

  // Filter reviews by the UI-selected location
  const locationFilteredReviews = useMemo(() => {
    if (selectedLocationId === ALL_LOCATIONS) return reviews;
    return reviews.filter(
      (review) => getReviewLocationId(review) === selectedLocationId,
    );
  }, [reviews, selectedLocationId]);

  const unrepliedCount = useMemo(
    () => locationFilteredReviews.filter(isUnrepliedReview).length,
    [locationFilteredReviews],
  );

  const displayedReviews = useMemo(() => {
    if (reviewStatusFilter !== "unreplied") return locationFilteredReviews;
    return locationFilteredReviews.filter(isUnrepliedReview);
  }, [locationFilteredReviews, reviewStatusFilter]);

  // Pagination
  const { totalPages, currentReviews, visiblePageNumbers } = useMemo(() => {
    const validReviews = Array.isArray(displayedReviews)
      ? displayedReviews
      : [];
    const total = Math.ceil(validReviews.length / REVIEWS_PER_PAGE);
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    const visibleCount = Math.min(total, MAX_VISIBLE_PAGE_BUTTONS);
    const halfWindow = Math.floor(visibleCount / 2);
    let firstVisiblePage = Math.max(currentPage - halfWindow, 1);
    const lastPossibleFirstPage = Math.max(total - visibleCount + 1, 1);
    firstVisiblePage = Math.min(firstVisiblePage, lastPossibleFirstPage);

    return {
      totalPages: Math.max(total, 1),
      currentReviews: validReviews.slice(start, start + REVIEWS_PER_PAGE),
      visiblePageNumbers: Array.from(
        { length: visibleCount },
        (_, idx) => firstVisiblePage + idx,
      ),
    };
  }, [displayedReviews, currentPage]);

  const handleFetchReviews = useCallback(() => {
    localStorage.removeItem("cachedReviews");
    fetchReviews(
      false,
      true,
      selectedLocationId === ALL_LOCATIONS ? null : selectedLocationId,
    );
  }, [fetchReviews, selectedLocationId]);

  const handleSelectLocation = useCallback(
    (locId) => {
      setSelectedLocationId(locId);
      setShowLocationOptions(false);
      setCurrentPage(1);
      fetchReviews(false, true, locId === ALL_LOCATIONS ? null : locId);
    },
    [fetchReviews],
  );

  const handleInputFocus = () => {
    setShowLocationOptions(true);
    setSearchInput(""); // Clear on focus so user can see all options right away
  };

  const handleInputBlur = () => {
    // Timeout gives onClick enough time to trigger on dropdown items before closing
    setTimeout(() => {
      setShowLocationOptions(false);
      setSearchInput(selectedLocationLabel); // Restore current label if selection was not changed
    }, 200);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [reviewStatusFilter, displayedReviews.length]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-lemon-hover animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-slate-50">
      <Toaster position={TOAST_POSITION} />

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="w-full px-4 sm:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter">
                  Reputation <span className="text-lemon-hover">Manager</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Location Feed
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {/* Location Search Dropdown */}
              <div className="relative w-full sm:w-80">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Search Location..."
                    className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-lemon-hover"
                  />
                </div>
                {showLocationOptions && (
                  <div className="absolute right-0 top-12 z-50 max-h-80 w-full overflow-auto rounded-xl border border-black/10 bg-white p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectLocation(ALL_LOCATIONS)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase ${
                        selectedLocationId === ALL_LOCATIONS
                          ? "bg-black text-lemon-glow"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>All Locations</span>
                    </button>
                    {filteredLocationOptions.length > 0 ? (
                      filteredLocationOptions.map((loc) => (
                        <button
                          key={loc.locationId}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectLocation(loc.locationId)}
                          className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase ${
                            selectedLocationId === loc.locationId
                              ? "bg-black text-lemon-glow"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between w-full">
                            <span className="truncate">{loc.title}</span>
                          </div>
                          <span className="text-[8px] opacity-50 font-bold">
                            {loc.locality || "No Locality"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">
                        No Locations Found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setReviewStatusFilter((curr) =>
                    curr === "unreplied" ? "all" : "unreplied",
                  )
                }
                className={`btn-ghost px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-1.5 ${
                  reviewStatusFilter === "unreplied"
                    ? "bg-black text-lemon-glow"
                    : ""
                }`}
              >
                <Filter className="w-3 h-3" />
                Without Reply ({unrepliedCount})
              </button>

              <button
                onClick={handleFetchReviews}
                disabled={loading}
                className="btn-ghost px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-1.5"
              >
                <RefreshCw
                  className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10">
        {loading && !hasLoadedReviews ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
            <h2 className="text-[10px] font-black uppercase tracking-widest">
              Synchronizing...
            </h2>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="bg-white border border-black/5 p-16 rounded-[2.5rem] text-center max-w-lg mx-auto shadow-sm">
            <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-6" />
            <h3 className="text-lg font-bold uppercase mb-2">No Reviews</h3>
            <p className="text-slate-400 text-[11px] mb-8">
              No entries found for the selected filter.
            </p>
            <button
              onClick={handleFetchReviews}
              className="btn-lemon px-10 py-4 rounded-xl font-black uppercase text-[9px]"
            >
              Force Sync ↗
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center justify-between border-b border-black/5 pb-5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Showing {displayedReviews.length} reviews
              </p>
              <p className="text-[8px] font-black text-black uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <div className="grid gap-8">
              {currentReviews.map((review) => (
                <ReviewCard
                  key={review.reviewId}
                  review={review}
                  handleAIReply={handleAIReply}
                  fetchReviews={handleFetchReviews}
                  isReplying={replyingTo === review.reviewId}
                  setReplyingTo={setReplyingTo}
                  session={session}
                  toastPosition={TOAST_POSITION}
                  locationAutoReply={locationAutoReply}
                  onToggleAutoReply={handleLocationAutoReplyToggle}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pb-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost p-2.5 rounded-xl disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  {visiblePageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-9 h-9 rounded-xl text-[9px] font-black transition-all border ${
                        currentPage === num
                          ? "bg-black text-lemon-glow border-black"
                          : "bg-white text-slate-400 border-black/5"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="btn-ghost p-2.5 rounded-xl disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <WhatsAppButton />
    </div>
  );
}