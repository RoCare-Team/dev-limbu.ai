"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  ArrowLeft,
  BarChart3,
  MousePointer,
  Navigation,
  Calendar,
  AlertCircle,
  Search,
  Hash,
  X,
  Download,
} from "lucide-react";
import { CircularProgress } from "@mui/material";
import { toast, Toaster } from "react-hot-toast";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";


// --- Fetch Insights API ---
export async function fetchLocationInsights(accessToken, locationId, startDate, endDate) {
  try {
    // Ensure dates are Date objects
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date format provided");
    }

    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${start.getFullYear()}&dailyRange.startDate.month=${start.getMonth() + 1}&dailyRange.startDate.day=${start.getDate()}&dailyRange.endDate.year=${end.getFullYear()}&dailyRange.endDate.month=${end.getMonth() + 1}&dailyRange.endDate.day=${end.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch insights: ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch Insights Error:", err);
    throw err;
  }
}


// Fetch search keywords
async function fetchSearchKeywords(accessToken, locationId, startMonth, endMonth) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startMonth.year}&monthlyRange.start_month.month=${startMonth.month}&monthlyRange.end_month.year=${endMonth.year}&monthlyRange.end_month.month=${endMonth.month}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch search keywords: ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch Search Keywords Error:", err);
    throw err;
  }
}

// InsightsModal Component
function InsightsModal({ isOpen, onClose, insights, listingTitle, loading, startDate, endDate, onDateChange, searchKeywords, searchKeywordsLoading, location }) {
  if (!isOpen) return null;

  // Format location name with address
  const fullLocationName = location?.address 
    ? `${listingTitle} - ${location.address}` 
    : listingTitle;

  return (
    <PerformanceInsightsModal
      isOpen={isOpen}
      onClose={onClose}
      insightsData={insights}
      businessName={listingTitle}
      locationName={fullLocationName}
      city={location?.locality || ""}
      locality={location?.address || ""}
      locationId={location?.locationId || ""}
      businessProfileId={location?.businessProfileId || ""}
      dateRange={{ startDate, endDate }}
      searchKeywords={searchKeywords}
      loading={loading}
      onDateChange={onDateChange}
    />
  );
}

export default function GmbInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [locations, setLocations] = useState([]);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [searchKeywordsLoading, setSearchKeywordsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [searchKeywordsData, setSearchKeywordsData] = useState(null);
  const [selectedListingTitle, setSelectedListingTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google", { callbackUrl: "/gmb-insights" });
    }
  }, [status]);

  // Load locations from localStorage
  useEffect(() => {
    if (status === "authenticated") {
      const locationDetails = localStorage.getItem("locationDetails");
      if (locationDetails) {
        try {
          const parsedLocations = JSON.parse(locationDetails);
          setLocations(parsedLocations);
          setLoading(false);
        } catch (err) {
          console.error("Error parsing location details:", err);
          toast.error("Failed to load locations");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [status]);

  // Handle View Insights - fetch data BEFORE opening modal (like dashboard)
  const handleViewInsights = async (location) => {
    // Always reset to 1 month default when opening new location
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const defaultEndDate = new Date();
    
    // Reset dates to default 1 month
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    
    // Store location first
    setSelectedListingTitle(location.title || "Unknown Listing");
    setSelectedLocation(location);

    // Fetch insights data first (synchronously-like behavior)
    setInsightsLoading(true);
    setSearchKeywordsLoading(true);
    setInsightsData(null);
    setSearchKeywordsData(null);

    try {
      // Fetch insights with default 1 month date range
      const insights = await fetchLocationInsights(session.accessToken, location.locationId, defaultStartDate, defaultEndDate);
      setInsightsData(insights);

      // Fetch search keywords
      const currentDate = new Date();
      const startMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() - 3
      };
      
      if (startMonth.month <= 0) {
        startMonth.month += 12;
        startMonth.year -= 1;
      }

      const endMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      };

      const keywords = await fetchSearchKeywords(session.accessToken, location.locationId, startMonth, endMonth);
      setSearchKeywordsData(keywords);
      
      // Now open the modal AFTER data is fetched
      setShowInsightsModal(true);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights. Please try again.");
    } finally {
      setInsightsLoading(false);
      setSearchKeywordsLoading(false);
      // Ensure modal opens even if there's an error (to show the error state)
      setShowInsightsModal(true);
    }
  };

  // Handle date change in modal - exactly like dashboard
  const handleDateChange = async (dateRange) => {
    // Handle both object format and direct date parameters
    const newStartDate = dateRange?.startDate || dateRange;
    const newEndDate = dateRange?.endDate || dateRange;
    
    // Ensure dates are proper Date objects
    const parsedStartDate = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
    const parsedEndDate = newEndDate instanceof Date ? newEndDate : new Date(newEndDate);
    
    setStartDate(parsedStartDate);
    setEndDate(parsedEndDate);
    
    // Get location ID from selected location
    const locationId = selectedLocation?.locationId;
    
    if (!locationId) {
      console.error("Location ID not found");
      toast.error("Location not found. Please try again.");
      return;
    }
    
    setInsightsLoading(true);
    try {
      const insights = await fetchLocationInsights(
        session.accessToken, 
        locationId, 
        parsedStartDate, 
        parsedEndDate
      );
      setInsightsData(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights for selected date range.");
    } finally {
      setInsightsLoading(false);
    }
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center flex flex-col items-center justify-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#3b82f6" }} />
          <p className="text-gray-700 font-semibold mt-6 text-lg">
            Loading insights...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Location grid view (always shown)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <Toaster position="top-right" />

      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insightsData}
        listingTitle={selectedListingTitle}
        loading={insightsLoading}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        searchKeywords={searchKeywordsData}
        searchKeywordsLoading={searchKeywordsLoading}
        location={selectedLocation}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GMB Insights </h1>
          <p className="text-gray-600">
            Select a location to view detailed insights and analytics
          </p>
        </div>

        {/* Locations Grid */}
        {locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                  location.isVerified
                    ? 'hover:shadow-lg hover:border-blue-300 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => location.isVerified && handleViewInsights(location)}
              >
                {/* Location Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                      {location.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{location.address}</span>
                    </div>
                    {location.locality && (
                      <p className="text-xs text-gray-500 mb-3">
                        {location.locality}
                      </p>
                    )}
                  </div>
                  {location.isVerified ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                      <Star className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                      <AlertCircle className="w-3 h-3" />
                      Unverified
                    </span>
                  )}
                </div>

                {/* Website link */}
                {location.websiteUrl && (
                  <div className="mb-4 pb-4 border-t border-gray-100 pt-4">
                    <a
                      href={location.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {location.websiteUrl}
                    </a>
                  </div>
                )}

                {/* View Insights Button */}
                <button
                  onClick={() => location.isVerified && handleViewInsights(location)}
                  disabled={!location.isVerified}
                  className={`w-full flex items-center justify-center gap-2 font-semibold px-4 py-3 rounded-lg transition-opacity ${
                    location.isVerified
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {location.isVerified ? 'View Insights' : 'Unverified Location'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Locations Found
            </h3>
            <p className="text-gray-600 mb-6">
              Please connect your Google Business Profile from the dashboard first
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
