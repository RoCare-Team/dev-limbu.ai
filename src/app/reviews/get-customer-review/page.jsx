"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, MessageSquare, User, Calendar, Store, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
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
              <Store className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Business Not Selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please confirm your business first to view customer reviews.
            </p>
            <button
              onClick={() => router.push("/get-magic-qr")}
              className="px-6 py-3 rounded-xl bg-neutral-600 hover:bg-neutral-700 text-white font-semibold shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
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

      <SupportModal showToast={showToast} />
      
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
    <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z"/>
  </svg>
</a>
    </div>
  );
}
