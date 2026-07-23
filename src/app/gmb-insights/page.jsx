"use client";

import React, { useState, useEffect } from "react";
import { useGmbConnection } from "@/hooks/useGmbConnection";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Star,
  TrendingUp,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  Globe,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";
import { getLocalStorage } from "@/utils/storage";
import { fetchInsightsViaServer } from "@/utils/fetchInsightsViaServer";

export default function GmbInsightsPage() {
  const gmb = useGmbConnection();
  const router = useRouter();

  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  // GMB connected na ho to connect par bhejo — app se logout NAHI.
  useEffect(() => {
    if (!gmb.loading && !gmb.connected) {
      gmb.connect("/gmb-insights");
    }
  }, [gmb.loading, gmb.connected]);

  // Load locations from localStorage
  useEffect(() => {
    if (gmb.connected) {
      const locationDetails = getLocalStorage("locationDetails");
      if (locationDetails) {
        try {
          const parsedLocations = JSON.parse(locationDetails);
          setLocations(parsedLocations);
        } catch (err) {
          console.error("Error parsing location details:", err);
          toast.error("Failed to load locations");
        }
      }
      setLoading(false);
    }
  }, [gmb.connected]);

  // Handle View Insights
  const handleViewInsights = async (location) => {
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const defaultEndDate = new Date();
    
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    
    setSelectedListingTitle(location.title || "Unknown Listing");
    setSelectedLocation(location);

    setInsightsLoading(true);
    setSearchKeywordsLoading(true);
    setInsightsData(null);
    setSearchKeywordsData(null);

    try {
      const { fetchStart, reportEnd: insightSeriesEnd } = getPerformanceInsightsWindows(defaultStartDate, defaultEndDate);

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

      // Access token ab server par hi rehta hai — proxy route se lete hain.
      const { insights, searchKeywords } = await fetchInsightsViaServer({
        locationId: location.locationId,
        startDate: fetchStart,
        endDate: insightSeriesEnd,
        startMonth,
        endMonth,
      });
      setInsightsData(insights);
      setSearchKeywordsData(searchKeywords);

      setShowInsightsModal(true);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights. Please try again.");
    } finally {
      setInsightsLoading(false);
      setSearchKeywordsLoading(false);
      setShowInsightsModal(true);
    }
  };

  // Handle date change in modal
  const handleDateChange = async (dateRange) => {
    const newStartDate = dateRange?.startDate || dateRange;
    const newEndDate = dateRange?.endDate || dateRange;
    
    const parsedStartDate = newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
    const parsedEndDate = newEndDate instanceof Date ? newEndDate : new Date(newEndDate);
    
    setStartDate(parsedStartDate);
    setEndDate(parsedEndDate);
    
    const locationId = selectedLocation?.locationId;
    
    if (!locationId) {
      console.error("Location ID not found");
      toast.error("Location not found. Please try again.");
      return;
    }
    
    setInsightsLoading(true);
    try {
      const { fetchStart, reportEnd: insightSeriesEnd } = getPerformanceInsightsWindows(parsedStartDate, parsedEndDate);
      const { insights } = await fetchInsightsViaServer({
        locationId,
        startDate: fetchStart,
        endDate: insightSeriesEnd,
      });
      setInsightsData(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights for selected date range.");
    } finally {
      setInsightsLoading(false);
    }
  };

  // Search logic
  const filteredLocations = locations.filter((location) => {
    const query = searchQuery.toLowerCase();
    return (
      location.title?.toLowerCase().includes(query) ||
      location.address?.toLowerCase().includes(query) ||
      location.locality?.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (gmb.loading || (gmb.connected && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
            Reading Performance Data...
          </p>
        </div>
      </div>
    );
  }

  if (!gmb.connected) {
    return null;
  }

  const fullLocationName = selectedLocation?.address 
    ? `${selectedListingTitle} - ${selectedLocation.address}` 
    : selectedListingTitle;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Toaster position="top-right" />

      {showInsightsModal && (
        <PerformanceInsightsModal
          isOpen={showInsightsModal}
          onClose={() => setShowInsightsModal(false)}
          insightsData={insightsData}
          businessName={selectedListingTitle}
          locationName={fullLocationName}
          city={selectedLocation?.locality || ""}
          locality={selectedLocation?.address || ""}
          locationId={selectedLocation?.locationId || ""}
          businessProfileId={selectedLocation?.businessProfileId || ""}
          dateRange={{ startDate, endDate }}
          searchKeywords={searchKeywordsData}
          loading={insightsLoading}
          onDateChange={handleDateChange}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Page Header with Inline Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          {/* Left Side: Back Button & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                Business <span className="text-yellow-500">Insights</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Analyze Local Search Performance</p>
            </div>
          </div>

          {/* Right Side: Search Bar (Only shown if locations exist) */}
          {locations.length > 0 && (
            <div className="relative w-full md:max-w-xs lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-black/5 rounded-2xl text-xs font-bold uppercase tracking-wider text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-black transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Locations Content */}
        {locations.length > 0 ? (
          <div>
            {filteredLocations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredLocations.map((location, idx) => (
                  <div
                    key={idx}
                    className={`group bg-white rounded-3xl border border-black/5 p-6 sm:p-8 transition-all duration-500 shadow-sm ${
                      location.isVerified
                        ? 'hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-black/5 cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => location.isVerified && handleViewInsights(location)}
                  >
                    {/* Header: Logo & Badge */}
                    <div className="flex items-start justify-between mb-6">
                       <div className="p-3 bg-slate-50 rounded-2xl border border-black/5 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                         <Building2 className="w-6 h-6" />
                       </div>
                       {location.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                          <Star className="w-3 h-3 fill-green-700" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest border border-red-100">
                          <AlertCircle className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="mb-8">
                      <h3 className="font-black text-base text-black uppercase tracking-tight mb-2 leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                        {location.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-4">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{location.address}</span>
                      </div>
                      {location.locality && (
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-black/5 inline-block">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{location.locality}</p>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-8 border-t border-black/5 pt-6">
                      {location.websiteUrl && (
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                          <Globe className="w-4 h-4 text-black opacity-30" />
                          <span className="truncate group-hover:text-yellow-600 transition-colors">
                            {location.websiteUrl.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <TrendingUp className="w-4 h-4 text-black opacity-30" />
                        <span>Real-time Analytics Ready</span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <button
                      disabled={!location.isVerified}
                      className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-[1.02]"
                    >
                      <BarChart3 className="w-4 h-4" />
                      {location.isVerified ? 'View Insights ↗' : 'Locked'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* No matching locations view */
              <div className="bg-white border border-black/5 rounded-[2.5rem] p-12 text-center max-w-md mx-auto shadow-xl shadow-black/5">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h4 className="font-black text-black uppercase tracking-tight mb-2">No Matching Locations</h4>
                <p className="text-slate-400 font-bold text-xs mb-6">
                  We couldn't find any locations matching "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State if no locations exist */
          <div className="bg-white border border-black/5 rounded-[2.5rem] p-12 sm:p-20 text-center max-w-2xl mx-auto shadow-2xl shadow-black/5">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-black/5">
              <Building2 className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>No Signal Found</h3>
            <p className="text-slate-400 font-bold mb-10 text-sm leading-relaxed">
              Connect your Google Business Profile to unlock advanced performance intelligence and search visibility metrics.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-lemon px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Back to Command Center ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
}