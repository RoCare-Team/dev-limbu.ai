"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
const ALL_ACCOUNTS = "all";

const normalizeGmbAccountId = (accountId) =>
  String(accountId || "").replace(/^accounts\//, "");

const reviewAccountId = (review) => normalizeGmbAccountId(review?.name?.split("/")?.[1]);

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
  const [selectedAccountId, setSelectedAccountId] = useState(ALL_ACCOUNTS);
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");

  const accountOptions = useMemo(() => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const locations = Array.isArray(parsed) ? parsed : [parsed];
      const accounts = new Map();

      locations.forEach((loc) => {
        const accountId = normalizeGmbAccountId(loc?.accountId);
        if (!accountId) return;
        const current = accounts.get(accountId) || {
          accountId,
          label: loc?.accountName || loc?.title || `GMB ${accountId}`,
          locationCount: 0,
        };
        current.locationCount += 1;
        accounts.set(accountId, current);
      });

      return Array.from(accounts.values());
    } catch (err) {
      console.error("Error reading GMB accounts:", err);
      return [];
    }
  }, []);

  const selectedAccountLabel = useMemo(() => {
    if (selectedAccountId === ALL_ACCOUNTS) return "All GMB Accounts";
    return (
      accountOptions.find((account) => account.accountId === selectedAccountId)?.label ||
      `GMB ${selectedAccountId}`
    );
  }, [accountOptions, selectedAccountId]);

  const filteredAccountOptions = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    if (!query) return accountOptions;
    return accountOptions.filter((account) =>
      `${account.label} ${account.accountId}`.toLowerCase().includes(query)
    );
  }, [accountOptions, accountSearch]);

  const accountFilteredReviews = useMemo(() => {
    if (selectedAccountId === ALL_ACCOUNTS) return reviews;
    return reviews.filter((review) => reviewAccountId(review) === selectedAccountId);
  }, [reviews, selectedAccountId]);

  const unrepliedCount = useMemo(
    () => accountFilteredReviews.filter(isUnrepliedReview).length,
    [accountFilteredReviews]
  );

  const displayedReviews = useMemo(() => {
    if (reviewStatusFilter !== "unreplied") return accountFilteredReviews;
    return accountFilteredReviews.filter(isUnrepliedReview);
  }, [accountFilteredReviews, reviewStatusFilter]);

  // Memoized pagination
  const { totalPages, currentReviews, visiblePageNumbers } = useMemo(() => {
    const validReviews = Array.isArray(displayedReviews) ? displayedReviews : [];
    const total = Math.ceil(validReviews.length / REVIEWS_PER_PAGE);
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    const visibleCount = Math.min(total, MAX_VISIBLE_PAGE_BUTTONS);
    const halfWindow = Math.floor(visibleCount / 2);
    let firstVisiblePage = Math.max(currentPage - halfWindow, 1);
    const lastPossibleFirstPage = Math.max(total - visibleCount + 1, 1);
    firstVisiblePage = Math.min(firstVisiblePage, lastPossibleFirstPage);

    return {
      totalPages: total,
      currentReviews: validReviews.slice(start, start + REVIEWS_PER_PAGE),
      visiblePageNumbers: Array.from(
        { length: visibleCount },
        (_, idx) => firstVisiblePage + idx
      ),
    };
  }, [displayedReviews, currentPage]);

  // Force fresh fetch — clears cache first
  const handleFetchReviews = useCallback(() => {
    localStorage.removeItem("cachedReviews");
    localStorage.removeItem("reviewsFetchedAt");
    fetchReviews(false, true, selectedAccountId === ALL_ACCOUNTS ? null : selectedAccountId);
  }, [fetchReviews, selectedAccountId]);

  const handleSelectAccount = useCallback(
    (accountId) => {
      setSelectedAccountId(accountId);
      setAccountSearch("");
      setShowAccountOptions(false);
      setCurrentPage(1);
      localStorage.removeItem("cachedReviews");
      localStorage.removeItem("reviewsFetchedAt");
      fetchReviews(false, true, accountId === ALL_ACCOUNTS ? null : accountId);
    },
    [fetchReviews]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [reviewStatusFilter, displayedReviews.length]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="text-center relative z-10">
          <Loader2 className="w-10 h-10 text-lemon-hover animate-spin mx-auto mb-6" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">
            Loading Reviews...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Toaster position={TOAST_POSITION} />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-0 w-125 h-100px z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      {/* ── Header ── */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
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
                <h1
                  className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Reputation <span className="text-lemon-hover">Manager</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Social Intelligence Feed
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <div className="relative w-full sm:w-72">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={showAccountOptions ? accountSearch : selectedAccountLabel}
                    onChange={(event) => {
                      setAccountSearch(event.target.value);
                      setShowAccountOptions(true);
                    }}
                    onFocus={() => {
                      setAccountSearch("");
                      setShowAccountOptions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowAccountOptions(false), 120)}
                    placeholder="Search GMB account"
                    className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none transition focus:border-lemon-hover"
                  />
                </div>
                {showAccountOptions && (
                  <div className="absolute right-0 top-12 z-50 max-h-72 w-full overflow-auto rounded-xl border border-black/10 bg-white p-1 shadow-xl">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectAccount(ALL_ACCOUNTS)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider ${
                        selectedAccountId === ALL_ACCOUNTS
                          ? "bg-black text-lemon-glow"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>All GMB Accounts</span>
                      <span>{reviews.length}</span>
                    </button>
                    {filteredAccountOptions.map((account) => {
                      const accountReviewCount = reviews.filter(
                        (review) => reviewAccountId(review) === account.accountId
                      ).length;
                      return (
                        <button
                          key={account.accountId}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectAccount(account.accountId)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider ${
                            selectedAccountId === account.accountId
                              ? "bg-black text-lemon-glow"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{account.label}</span>
                          <span className="shrink-0 text-[9px] opacity-70">
                            {accountReviewCount} / {account.locationCount} loc
                          </span>
                        </button>
                      );
                    })}
                    {filteredAccountOptions.length === 0 && (
                      <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        No account found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setReviewStatusFilter((current) =>
                    current === "unreplied" ? "all" : "unreplied"
                  )
                }
                className={`btn-ghost px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-1.5 ${
                  reviewStatusFilter === "unreplied" ? "bg-black text-lemon-glow" : ""
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
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {loading && !hasLoadedReviews ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] opacity-50">
            <Loader2 className="w-12 h-12 text-black animate-spin mb-6" />
            <h2 className="text-[10px] font-black text-black uppercase tracking-widest">
              Synchronizing Stream...
            </h2>
          </div>
        ) : error ? (
          <div className="bg-white border border-black/5 p-10 rounded-[2.5rem] text-center max-w-lg mx-auto shadow-2xl">
            <div className="bg-red-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3
              className="text-lg font-bold text-black mb-3 uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Access <span className="text-red-500">Denied</span>
            </h3>
            <p className="text-slate-500 font-medium mb-8 text-[11px] leading-relaxed">
              {error === "LOCATION_NOT_FOUND" || error === "LOCATION_EMPTY"
                ? "Deploy your business locations to analyze customer feedback."
                : "We encountered an intelligence gap. Please re-authenticate."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleFetchReviews}
                disabled={loading}
                className="btn-lemon px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px]"
              >
                Retry Link ↗
              </button>
              <Link
                href="/dashboard"
                className="btn-ghost px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px]"
              >
                Return Hub
              </Link>
            </div>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="bg-white border border-black/5 p-16 rounded-[3rem] text-center max-w-lg mx-auto shadow-2xl">
            <div className="bg-slate-50 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-black/5">
              <MessageCircle className="w-10 h-10 text-slate-100" />
            </div>
            <h3
              className="text-lg font-bold text-black mb-3 uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Stream <span className="text-slate-300">Quiet</span>
            </h3>
            <p className="text-slate-400 font-medium mb-8 text-[11px]">
              {reviewStatusFilter === "unreplied"
                ? "No reviews without replies found for this GMB account."
                : "No entries found. Deploy your Magic QR to start capturing feedback."}
            </p>
            <button
              onClick={handleFetchReviews}
              disabled={loading}
              className="btn-lemon px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[9px]"
            >
              Force Sync ↗
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center justify-between border-b border-black/5 pb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {displayedReviews.length} of {accountFilteredReviews.length} reviews
                </p>
              </div>
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

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pb-10 max-w-full overflow-hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost p-2.5 rounded-xl disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 overflow-hidden">
                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-9 h-9 shrink-0 rounded-xl text-[9px] font-black transition-all border ${
                        currentPage === pageNumber
                          ? "bg-black text-lemon-glow border-black shadow-lg"
                          : "bg-white text-slate-400 border-black/5 hover:border-black/20"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
