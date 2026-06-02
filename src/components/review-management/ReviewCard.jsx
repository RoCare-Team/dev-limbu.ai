import React, { useState, memo, useMemo } from "react";
import {
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Building2,
  MapPin,
  User,
  CheckCircle2,
  Calendar,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import StarRating from "./StarRating";
import { getLocalStorage } from "@/utils/storage";


const normalizeGmbAccountId = (accountId) =>
  String(accountId || "").replace(/^accounts\//, "");

const ReviewCard = memo(({
  review,
  handleAIReply,
  fetchReviews,
  isReplying,
  setReplyingTo,
  toastPosition,
  locationAutoReply,        // { [accountId]: boolean }
  onToggleAutoReply,        // (accountId) => void
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [localReply, setLocalReply] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  // Extract locationId and accountId from review.name
  const { locationId, accountId } = useMemo(() => {
    const parts = review.name?.split("/") || [];
    return {
      accountId: parts[1] || null,
      locationId: parts[3] || null,
    };
  }, [review.name]);

  // Get location info from localStorage
  const locationInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (!raw || !locationId) return null;
      const locationDetails = JSON.parse(raw);
      return locationDetails.find((loc) => loc.locationId === locationId) || null;
    } catch (err) {
      console.error("Error getting location details:", err);
      return null;
    }
  }, [locationId]);

  // Per-location autoReply state
  const normalizedAccountId = normalizeGmbAccountId(accountId);
  const isAutoReplyOn = normalizedAccountId ? (locationAutoReply?.[normalizedAccountId] ?? false) : false;

  const handleManualReply = async () => {
    if (!localReply.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setReplyingTo(review.reviewId);

      const userId =
        getLocalStorage("isImpersonating") === "true"
          ? getLocalStorage("impersonatedUser")
          : getLocalStorage("userId");

      if (!userId) throw new Error("User ID not found. Please log in again.");

      const { reviewId } = review;
      const res = await fetch("/api/gmb/review-manual-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountId,
          locationId,
          reviewId,
          replyText: localReply,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === true) {
        toast.success("Reply posted successfully!", { duration: 3000, position: toastPosition });
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
        position: toastPosition,
      });
    } finally {
      setReplyingTo(null);
    }
  };

  const onAIReplyClick = async () => {
    const success = await handleAIReply(review, setLocalReply, setShowReplyInput, setGeneratingAI);
    if (success) await fetchReviews();
  };

  const reviewDate = new Date(review.createTime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-lemon-hover/30 transition-all duration-300 overflow-hidden">

      {/* ── Top Business Badge with per-GMB-account Auto Reply toggle ── */}
      {locationInfo && (
        <div className="bg-slate-50/80 px-5 py-2 border-b border-slate-100 flex items-center justify-between">
          {/* Left: business name + locality */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[160px]">
              {locationInfo.title}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span>{locationInfo.locality}</span>
            </div>
          </div>

          {/* Right: per-GMB-account Auto Reply toggle */}
          {accountId && locationId && onToggleAutoReply && (
            <button
              onClick={() => onToggleAutoReply(normalizedAccountId)}
              title={isAutoReplyOn ? "Auto Reply ON for this GMB account - click to disable" : "Auto Reply OFF for this GMB account - click to enable"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                isAutoReplyOn
                  ? "bg-lemon-glow text-black border-yellow-300 shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Zap className={`w-3 h-3 ${isAutoReplyOn ? "fill-black" : ""}`} />
              {isAutoReplyOn ? "Auto ON" : "Auto OFF"}
            </button>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* ── Reviewer Avatar ── */}
          <div className="relative flex-shrink-0">
            {review.reviewer?.profilePhotoUrl ? (
              <img
                src={review.reviewer.profilePhotoUrl}
                alt={review.reviewer?.displayName}
                className="w-12 h-12 rounded-full ring-2 ring-slate-50 object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-50">
                <User className="w-6 h-6 text-slate-300" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-slate-100 shadow-xs">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Maps_icon.svg"
                className="w-3 h-3"
                alt="G"
              />
            </div>
          </div>

          {/* ── Main Content Area ── */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    {review.reviewer?.displayName || "Verified Customer"}
                  </h3>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-100">
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[8px] font-bold text-green-600 uppercase tracking-tight">Verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.starRating} />
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {reviewDate}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Review Body ── */}
            <div className="relative">
              <p className="text-slate-600 text-[13px] sm:text-[14px] leading-relaxed mb-4">
                {review.comment ? (
                  `"${review.comment}"`
                ) : (
                  <span className="text-slate-400 italic">
                    The customer gave a rating but didn't leave a comment.
                  </span>
                )}
              </p>
            </div>

            {/* ── Official Response Section ── */}
            {review.reviewReply?.comment ? (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group/reply">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-lemon-glow rounded-md">
                    <Sparkles className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Business Response
                  </span>
                </div>
                <p className="text-slate-600 text-[13px] leading-relaxed italic">
                  "{review.reviewReply.comment}"
                </p>
              </div>
            ) : (
              /* ── Action Buttons ── */
              <div className="flex flex-wrap gap-2.5 mt-4">
                <button
                  onClick={onAIReplyClick}
                  disabled={generatingAI || isReplying}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[11px] font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {generatingAI ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-lemon-glow" />
                  )}
                  {generatingAI ? "Writing..." : "Write AI Reply"}
                </button>

                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Type a Reply
                </button>
              </div>
            )}

            {/* ── Reply Input Area ── */}
            {showReplyInput && (
              <div className="mt-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <textarea
                    value={localReply}
                    onChange={(e) => setLocalReply(e.target.value)}
                    placeholder="Write a professional reply..."
                    className="w-full min-h-[100px] p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-lemon-glow focus:border-lemon-hover outline-none transition-all resize-none shadow-sm"
                    disabled={isReplying}
                  />
                  <div className="absolute bottom-3 right-3 text-[9px] font-medium text-slate-400">
                    {localReply.length} chars
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualReply}
                    disabled={isReplying || !localReply?.trim()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-[11px] font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isReplying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Send Official Reply
                  </button>
                  <button
                    onClick={() => setShowReplyInput(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-all"
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
});

ReviewCard.displayName = "ReviewCard";

export default ReviewCard;
