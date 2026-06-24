"use client";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Star, ExternalLink, CheckCircle, Sparkles, Loader2 } from "lucide-react";

export default function CustomerReviewPage() {
  const params = useParams();
  const [business, setBusiness] = useState("");
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [locationId, setLocationId] = useState("");
  const [rating, setRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [reviewUri, setReviewUri] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [additionalCategories, setAdditionalCategories] = useState([]);
  const [aiReviews, setAiReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [copyingIndex, setCopyingIndex] = useState(null);
  const [slug, setSlug] = useState("");

  /**
   * Must run synchronously inside the user's tap (before any await) or iOS Safari blocks pop-ups.
   * If a new tab is blocked, same-tab navigation still reaches Google Review.
   */
  const openGoogleReviewNow = (url) => {
    if (!url || typeof window === "undefined") return;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    // Blocked pop-up (typical on iOS if not in direct tap handler) → same-tab works
    if (w == null) {
      window.location.assign(url);
    }
  };

  // Decode location data from URL slug
  useEffect(() => {
    // Get slug from params (folder is [bussiness])
    const slug = params?.bussiness;
    
    if (!slug) {
      setErrorMsg("❌ Invalid review link. Please scan the QR code again.");
      setLoading(false);
      return;
    }

    setSlug(slug);

    // Fetch business data from API using slug
    fetchBusinessDataBySlug(slug);
  }, [params]);

  // Fetch business data using slug
  const fetchBusinessDataBySlug = async (slug) => {
    try {
      setLoading(true);
      
      console.log("📍 Fetching data for slug:", slug);
      
      // Call API to get business info by slug
      const res = await fetch(`/api/review-page/${slug}`);
      const data = await res.json();

      console.log("📥 Received data:", data);

      if (data.error) {
        setErrorMsg(data.message || `❌ ${data.error}`);
        setLoading(false);
        return;
      }

      // Set business data
      setBusiness(data.title || "");
      setLocality(data.locality || "");
      setAddress(data.storefrontAddress?.addressLines?.join(", ") || "");
      setLocationId(data.locationId || "");
      setReviewUri(data.newReviewUri || "");
      setPrimaryCategory(data.primaryCategory || "");
      setAdditionalCategories(data.additionalCategories || []);
      if (!data.newReviewUri) {
        setErrorMsg("⚠ Google Review link not available for this location");
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setErrorMsg("⚠ Unable to load review page. Please try again.");
      setLoading(false);
    }
  };

  // Save review to database
  const saveReviewToDB = async ({ name, rating, feedback }) => {
    try {
      const payload = {
        business,
        locality,
        locationId,
        rating,
        name: name?.trim() || "Anonymous",
        feedback: feedback?.trim() || "",
        timestamp: new Date().toISOString()
      };

      const response = await fetch("/api/customer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (!response.ok) {
        console.error("Failed to save review");
      }
    } catch (err) {
      console.error("Save Review Error:", err);
    }
  };

  // When user clicks a star
  const handleRating = async (value) => {
    setRating(value);
    if (value <= 3) {
      setShowFeedback(true);
    } else {
      // 4 or 5 stars: generate AI reviews
      if (!reviewUri) {
        setErrorMsg("⚠ Google review link is not available yet. Please try again.");
        return;
      }
      setRedirecting(true);
      try {
        const slugValue = slug || params?.bussiness || "";
        const res = await fetch(
          `/api/reviews/pool?slug=${encodeURIComponent(
            slugValue
          )}&business_name=${encodeURIComponent(business)}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews) && data.reviews.length) {
          setAiReviews(data.reviews);
          setShowReviewModal(true);
        } else {
          setErrorMsg("AI review generation failed. Please try again.");
        }
      } catch (e) {
        setErrorMsg("AI review generation failed. Please try again.");
      }
      setRedirecting(false);
    }
  };

  /** Same-tick copy (no await) — best for mobile Safari before window.open. */
  const copyTextToClipboardSync = (text) => {
    const str = String(text ?? "").trim();
    if (!str) return false;
    try {
      const ta = document.createElement("textarea");
      ta.value = str;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, str.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      console.warn("execCommand copy failed", e);
      return false;
    }
  };

  const copyTextToClipboardAsync = async (text) => {
    const str = String(text ?? "").trim();
    if (!str) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(str);
        return true;
      }
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed", e);
    }
    return false;
  };

  // Rotate a copied review on the server so the same text is never shown again.
  const rotateReview = (key) => {
    const slugValue = slug || params?.bussiness || "";
    if (!slugValue || !key) return;
    // keepalive: true → request still completes even if the page navigates to Google.
    fetch("/api/reviews/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slugValue, key }),
      keepalive: true,
    }).catch((e) => console.error("Review rotate failed", e));
  };

  // Copy first, then open Google — opening a new tab first often breaks clipboard on mobile.
  const handleCopyAndRedirect = async (review, index) => {
    if (!reviewUri) {
      setErrorMsg("⚠ Google review link is not available.");
      return;
    }

    const reviewText = review?.text || "";

    setCopyingIndex(index);
    try {
      if (!copyTextToClipboardSync(reviewText)) {
        await copyTextToClipboardAsync(reviewText);
      }
      // Fire rotation + DB save BEFORE opening Google, so navigating away
      // (especially same-tab on mobile) doesn't cancel these requests.
      rotateReview(review?.key);
      saveReviewToDB({
        name: customerName,
        rating,
        feedback: reviewText,
      }).catch((e) => console.error("Save review failed", e));
      openGoogleReviewNow(reviewUri);
      setShowReviewModal(false);
      setShowSuccess(true);
    } finally {
      setCopyingIndex(null);
    }
  };

  /** Skip AI text — go straight to Google (same synchronous open rule). */
  const handleSkipToGoogle = () => {
    if (!reviewUri) {
      setErrorMsg("⚠ Google review link is not available.");
      return;
    }
    openGoogleReviewNow(reviewUri);
    setShowReviewModal(false);
    setShowSuccess(true);
  };

  // Submit low-rating feedback
  const submitFeedback = async () => {
    if (!feedback.trim()) return;

    await saveReviewToDB({
      name: customerName,
      rating,
      feedback,
    });

    setShowFeedback(false);
    setShowSuccess(true);
    setFeedback("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 flex flex-col items-center max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-gradient-to-tr from-indigo-50 to-white p-4 rounded-full shadow-sm border border-indigo-100">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Just a moment</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            We are fetching the business details for you. Please wait while we get everything ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* AI Review Modal */}
          {showReviewModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
    <div
      className="
        bg-white rounded-2xl shadow-2xl
        w-full max-w-sm md:max-w-md
        p-4 md:p-6
        animate-in fade-in zoom-in duration-200
      "
    >
      {/* Header */}
      <div className="text-center mb-4 md:mb-5">
        <div className="inline-flex p-2.5 md:p-3 bg-blue-50 rounded-full mb-2 md:mb-3">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        </div>

        <h2 className="text-sm md:text-lg font-bold text-gray-900">
          Select a Review / समीक्षा चुनें
        </h2>

        <p className="text-[11px] md:text-xs text-gray-500 mt-1 md:mt-2 leading-relaxed px-1">
          Tap &quot;Copy &amp; Post&quot; — text is copied first, then Google opens. Paste in the review box.
        </p>
      </div>

      {/* Reviews */}
      <ul
        className="
          space-y-2 md:space-y-3
max-h-[38vh] md:max-h-[48vh]
          overflow-y-auto pr-1 custom-scrollbar
        "
      >
        {aiReviews.map((review, idx) => (
          <li
            key={review?.key || idx}
            className="
              border border-gray-100 rounded-xl
              p-3 md:p-4
              bg-gray-50 hover:bg-white
              hover:border-blue-200 transition
            "
          >
            <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed mb-2 md:mb-3">
              {review?.text}
            </p>

            <button
              type="button"
              className={`flex items-center justify-center gap-2 w-full
                py-2 md:py-2.5
                rounded-lg text-[11px] md:text-xs font-bold transition
                ${
                  copyingIndex === idx
                    ? "bg-green-500 text-white"
                    : "bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
                }
              `}
              onClick={() => handleCopyAndRedirect(review, idx)}
              disabled={copyingIndex !== null}
            >
              {copyingIndex === idx ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copyingIndex === idx ? "Opening Google…" : "Copy & Post"}
            </button>
          </li>
        ))}
      </ul>

      {/* Limbu AI Credit */}
      <p className="text-[10px] md:text-[11px] text-center text-gray-400 mt-3 md:mt-4 italic">
        Reviews written by <span className="font-semibold text-gray-500">Limbu AI</span>
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="py-2.5 md:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm shadow-md"
          onClick={handleSkipToGoogle}
        >
          Skip
          <span className="block font-normal text-[10px] md:text-[11px] opacity-90 mt-0.5">
            Google Reviews खोलें
          </span>
        </button>
        <button
          type="button"
          className="py-2.5 md:py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs md:text-sm"
          onClick={() => setShowReviewModal(false)}
        >
          Cancel
          <span className="block font-normal text-[10px] md:text-[11px] text-gray-600 mt-0.5">
            बिना चुने बंद करें
          </span>
        </button>
      </div>
    </div>
  </div>
)}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 capitalize">
            {business || "Business Name"}
          </h2>
          {locality && <p className="mt-2 text-sm text-gray-600">{locality}</p>}
          {address && <p className="text-xs text-gray-500 mt-1">{address}</p>}
          <p className="mt-2 text-sm text-gray-500">
            We value your feedback. Please rate your experience.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMsg ? (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
              <p>{errorMsg}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Tap a star to rate
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      disabled={redirecting}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={42}
                        className={`${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showSuccess && !redirecting && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Thank you!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your feedback has been submitted successfully.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Powered by LimbuAI Footer */}
      <div className="mt-12 text-center">
        <a href="https://limbu.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors group">
          Powered by
          <Image src="/images/bg-logo.png" alt="LimbuAI Logo" width={22} height={22} className="transition-transform group-hover:scale-110" />
          <span className="font-semibold text-gray-700 group-hover:text-indigo-600">LimbuAI</span>
        </a>
      </div>

      {/* Redirecting Loader */}
      {redirecting && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-2xl mx-auto relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-3xl p-8 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-10 animate-pulse"></div>
            
            <div className="relative flex flex-col items-center gap-5">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-green-200 rounded-full opacity-30"></div>
                <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent border-r-transparent animate-spin"></div>
                
                <div className="absolute inset-2 border-4 border-emerald-300 rounded-full opacity-40"></div>
                <div className="absolute inset-2 border-4 border-emerald-600 rounded-full border-b-transparent border-l-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-3 bg-white rounded-full shadow-lg animate-pulse">
                    <ExternalLink className="text-green-600" size={32} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-2xl font-bold text-green-800 animate-pulse">
                  🎉 Something Amazing is Happening...
                </p>
                <p className="text-base text-green-700 font-medium">
                  Thank you for your wonderful feedback!
                </p>
                <p className="text-sm text-green-600">
                  Preparing your Google Review experience
                </p>
              </div>

              <div className="w-full max-w-xs h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
              </div>

              <div className="flex gap-3">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce shadow-lg"></div>
                <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.15s'}}></div>
                <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.3s'}}></div>
              </div>

              <div className="flex gap-2 text-yellow-500">
                <Sparkles size={20} className="animate-pulse" />
                <Sparkles size={16} className="animate-pulse" style={{animationDelay: '0.3s'}} />
                <Sparkles size={20} className="animate-pulse" style={{animationDelay: '0.6s'}} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl transform animate-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-orange-100 rounded-2xl mb-4">
                <Star size={32} className="text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Help Us Improve</h2>
              <p className="text-gray-600 text-sm">We appreciate your honest feedback</p>
            </div>

            <textarea
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-colors"
              placeholder="Share your thoughts with us..."
              rows="5"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl transition-colors font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={!feedback.trim()}
                onClick={submitFeedback}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Submit Feedback
              </button>
                    </div>
          </div>
        </div>
      )}
    </div>
  );
}