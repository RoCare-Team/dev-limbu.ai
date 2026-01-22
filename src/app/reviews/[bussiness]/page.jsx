"use client";
import { useEffect, useState } from "react";
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

  // Decode location data from URL slug
  useEffect(() => {
    // Get slug from params (folder is [bussiness])
    const slug = params?.bussiness;
    
    if (!slug) {
      setErrorMsg("❌ Invalid review link. Please scan the QR code again.");
      setLoading(false);
      return;
    }

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
      });

      if (!response.ok) {
        console.error("Failed to save review");
      }
    } catch (err) {
      console.error("Save Review Error:", err);
    }
  };

  // When user clicks a star
  const handleRating = (value) => {
    setRating(value);

    if (value <= 3) {
      // Low rating - show feedback form
      setShowFeedback(true);
    } else {
      // High rating - redirect to Google
      if (!reviewUri) {
        setErrorMsg("⚠ Google review link is not available yet. Please try again.");
        return;
      }

      setRedirecting(true);

      setTimeout(async () => {
        // Save the rating
        await saveReviewToDB({
          name: customerName,
          rating: value,
        });

        // Open Google Review in new tab
        window.open(reviewUri, "_blank");

        setRedirecting(false);
        setShowSuccess(true);
      }, 1200);
    }
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