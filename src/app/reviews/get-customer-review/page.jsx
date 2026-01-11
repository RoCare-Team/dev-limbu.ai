"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, MessageSquare, User, Calendar, Store, Quote, X, Phone, AlertCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");

  // ---------------- READ BUSINESS NAME ----------------
  const getBusinessName = () => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed[0]?.title || "";
    } catch (e) {
      console.error("localStorage error", e);
      return "";
    }
  };

  // ---------------- AUTO FETCH ON PAGE LOAD ----------------
  useEffect(() => {
    fetchReviews();
  }, []);

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

  // ---------------- FETCH REVIEWS ----------------
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const business = getBusinessName();
      const res = await fetch(`/api/customer-review?business=${encodeURIComponent(business)}`);
      const data = await res.json();

      if (!data.success) {
        setError("Something went wrong!");
        return;
      }

      setReviews(data.reviews);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total).toFixed(1) : 0;
    return { total, avg };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 w-full">
      <Toaster />
      
      {/* ---------------- IF BUSINESS NOT SELECTED ---------------- */}
      {!getBusinessName() && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Business Not Selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please confirm your business first to view customer reviews.
            </p>
            <button
              onClick={() => router.push("/get-magic-qr")}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
            >
              Select Business
            </button>
          </div>
        </div>
      )}

      {/* ---------------- IF BUSINESS SELECTED → SHOW REVIEWS ---------------- */}
      {getBusinessName() && (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Store className="w-4 h-4" />
                {getBusinessName()}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[160px]">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[160px]">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avg}</p>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white h-64 rounded-2xl shadow-sm animate-pulse"></div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* ---------------- REVIEW LIST ---------------- */}
          {!loading && !error && (
            <>
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No reviews yet</h3>
                <p className="text-gray-500">Share your Magic QR code to get more reviews!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col h-full group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {r.name ? r.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                            {r.name || "Anonymous User"}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Feedback Content */}
                    <div className="flex-grow relative">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-gray-100 -z-0 transform -scale-x-100" />
                      <p className="text-gray-600 text-sm leading-relaxed relative z-10 pl-2">
                        {r.feedback || <span className="italic text-gray-400">No written feedback provided.</span>}
                      </p>
                    </div>

                    {/* Footer / Business Tag */}
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Business</span>
                      <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">
                        {r.business || "Unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}
        </div>
      )}

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
