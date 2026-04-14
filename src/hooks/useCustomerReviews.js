import { useState, useEffect, useMemo, useCallback } from "react";
import { getLocalStorage } from "@/utils/storage";

export function useCustomerReviews() {
  const [isMounted, setIsMounted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Initial Load: Business Name from LocalStorage
  useEffect(() => {
    setIsMounted(true);
    const raw = getLocalStorage("locationDetails");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const name = parsed[0]?.title || "";
        setBusinessName(name);
        if (name) {
          fetchReviews(name);
        }
      } catch (e) {
        console.error("localStorage error", e);
      }
    }
  }, []);

  // Fetch Reviews Function
  const fetchReviews = useCallback(async (business) => {
    if (!business) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/customer-review?business=${encodeURIComponent(business)}`
      );
      const data = await res.json();

      if (!data.success) {
        setError("Something went wrong while loading reviews.");
        return;
      }

      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Derived Stats: Total and Average Sentiment
  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? (
            reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total
          ).toFixed(1)
        : 0;
    return { total, avg };
  }, [reviews]);

  return {
    isMounted,
    businessName,
    reviews,
    loading,
    error,
    stats,
    refreshReviews: () => fetchReviews(businessName)
  };
}