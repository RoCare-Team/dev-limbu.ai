"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, Calendar, AlertCircle, RefreshCw, BarChart3, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import PerformanceInsightsReport from "./PerformanceInsightsReport";
import { generatePerformanceInsightsPDF } from "@/lib/performancePdfGenerator";
import { savePerformanceInsights, calculateMetricsInRange } from "@/lib/performanceInsightsUtils";

const PerformanceInsightsModal = ({
  isOpen,
  onClose,
  insightsData,
  businessName,
  locationName,
  city = "",
  locality = "",
  locationId,
  businessProfileId,
  dateRange,
  searchKeywords,
  loading = false,
  onDateChange,
}) => {
  const reportRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInsight, setSavedInsight] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [hasAutoSavedThisSession, setHasAutoSavedThisSession] = useState(false);
  const autoRefreshIntervalRef = useRef(null);
  const [localStartDate, setLocalStartDate] = useState(new Date());
  const [localEndDate, setLocalEndDate] = useState(new Date());
  const [reportMode, setReportMode] = useState("1month"); // "1month" or "6months"

  // Helper to safely format date for input[type="date"]
  const formatDateForInput = (date) => {
    try {
      if (!date || isNaN(new Date(date).getTime())) {
        return new Date().toISOString().split("T")[0];
      }
      return new Date(date).toISOString().split("T")[0];
    } catch (e) {
      return new Date().toISOString().split("T")[0];
    }
  };

  // Sync local state with props when modal opens or dateRange changes
  useEffect(() => {
    if (isOpen && dateRange) {
      if (dateRange.startDate) {
        const d = new Date(dateRange.startDate);
        if (!isNaN(d.getTime())) setLocalStartDate(d);
      }
      if (dateRange.endDate) {
        const d = new Date(dateRange.endDate);
        if (!isNaN(d.getTime())) setLocalEndDate(d);
      }
    }
  }, [isOpen, dateRange]);

  // Monitor displayData changes
  useEffect(() => {
    if (displayData) {
      console.log("Display data loaded successfully");
    }
  }, [displayData]);

  // Reset hasAutoSavedThisSession when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAutoSavedThisSession(false);
    }
  }, [isOpen]);

  // Update display data when fresh insights data comes from parent
  useEffect(() => {
    if (insightsData && isOpen) {
      console.log("Fresh data received from parent, updating display...");

      const rs = dateRange?.startDate ? new Date(dateRange.startDate) : localStartDate;
      const re = dateRange?.endDate ? new Date(dateRange.endDate) : localEndDate;
      const metrics = calculateMetricsInRange(insightsData, rs, re);

      setDisplayData((prev) => ({
        ...prev,
        insightsData: insightsData,
        searchKeywords: searchKeywords,
        metrics: metrics,
        dateRange: {
          startDate: rs.toISOString(),
          endDate: re.toISOString(),
        },
        businessName: businessName,
        locationName: locationName,
      }));

      setLastUpdated(new Date());
    }
  }, [insightsData, isOpen, dateRange?.startDate, dateRange?.endDate, searchKeywords, businessName, locationName, localStartDate, localEndDate]);

  // Auto-save insights to DB when component mounts with data, then fetch from DB
  useEffect(() => {
    if (!isOpen || !insightsData || loading || hasAutoSavedThisSession) return;

    const autoSaveAndFetchInsights = async () => {
      try {
        setIsSaving(true);
        const reportDate = new Date(localEndDate);
        const month = reportDate.toLocaleString("en-US", { month: "long" });
        const year = reportDate.getFullYear();

        // Step 0: Check if record already exists in database
        const queryParams = new URLSearchParams({
          locationId: locationId,
          reportMonth: month,
          reportYear: String(year),
        });

        const checkUrl = `/api/performance-insights?${queryParams.toString()}`;

        const checkResponse = await fetch(checkUrl, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        const checkData = await checkResponse.json();
        const existingRecord = checkData.success && checkData.data && checkData.data.length > 0 ? checkData.data[0] : null;

        if (existingRecord) {
          // Record exists in database - use it, don't overwrite with old parent data
          console.log("✓ Record exists in database - using existing data (not overwriting)");
          setDisplayData(existingRecord);
          toast.success("✓ Loaded from database!", { id: "auto-save" });
        } else {
          // Record doesn't exist - save new one from parent data
          console.log("✓ No existing record - creating new one");
          const rs = dateRange?.startDate ? new Date(dateRange.startDate) : localStartDate;
          const re = dateRange?.endDate ? new Date(dateRange.endDate) : localEndDate;
          const metrics = calculateMetricsInRange(insightsData, rs, re);

          const insightsPayload = {
            locationId,
            businessName,
            locationName,
            city: city || "",
            locality: locality || "",
            businessProfileId,
            insightsData,
            searchKeywords,
            dateRange: {
              startDate: rs.toISOString(),
              endDate: re.toISOString(),
            },
            reportMonth: month,
            reportYear: year,
            metrics,
          };

          // Save to database
          const saveResponse = await savePerformanceInsights(insightsPayload);
          setSavedInsight(saveResponse.data);
          toast.success("✓ Insights saved to database!", { id: "auto-save" });

          // Fetch the just-saved record
          const fetchUrl = `/api/performance-insights?${queryParams.toString()}`;
          const fetchResponse = await fetch(fetchUrl, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });

          if (!fetchResponse.ok) {
            throw new Error(`Fetch failed: ${fetchResponse.status}`);
          }

          const fetchedData = await fetchResponse.json();

          if (fetchedData.success && fetchedData.data && fetchedData.data.length > 0) {
            const latestRecord = fetchedData.data[0];
            setDisplayData(latestRecord);
          } else {
            console.warn("No data returned from fetch");
            toast.error("Failed to fetch saved data", { id: "auto-save" });
          }
        }

        // Mark that we've auto-saved this session
        setHasAutoSavedThisSession(true);
        setIsSaving(false);
      } catch (error) {
        console.error("Error in autoSaveAndFetchInsights:", error);
        toast.error(error.message || "Failed to load/save insights", { id: "auto-save" });
        setIsSaving(false);
      }
    };

    autoSaveAndFetchInsights();
  }, [isOpen, insightsData, loading, locationId, businessName, locationName, businessProfileId, searchKeywords, hasAutoSavedThisSession, dateRange?.startDate, dateRange?.endDate]);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      if (!reportRef.current) {
        toast.error("Report element not found");
        setIsDownloading(false);
        return;
      }

      if (!displayData) {
        toast.error("No data available to download");
        setIsDownloading(false);
        return;
      }

      const metadata = {
        businessName: displayData.businessName,
        locationName: displayData.locationName,
        reportMonth: displayData.reportMonth,
        reportYear: displayData.reportYear,
        startDate: new Date(displayData.dateRange.startDate),
        endDate: new Date(displayData.dateRange.endDate),
      };

      // The generator now handles its own toasts for success/error
      await generatePerformanceInsightsPDF(reportRef.current, metadata);

      setIsDownloading(false);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // Don't show duplicate toast here as generator already shows one
      setIsDownloading(false);
    }
  };

  const handleApplyDateRange = () => {
    if (onDateChange) {
      // Ensure dates are proper Date objects
      const startDate = localStartDate instanceof Date ? localStartDate : new Date(localStartDate);
      const endDate = localEndDate instanceof Date ? localEndDate : new Date(localEndDate);

      onDateChange({
        startDate: startDate,
        endDate: endDate,
      });
    }
    setShowDatePicker(false);
  };

  const handleResetDateRange = () => {
    // Default to Last 1 Month (Current Month vs Previous Month)
    const date = new Date();
    date.setDate(1); // First day of current month
    date.setMonth(date.getMonth() - 1); // Go to first day of previous month
    setLocalStartDate(date);
    setLocalEndDate(new Date());
    setReportMode("1month");
  };

  // Handler for Last 1 Month button
  const handleLast1Month = async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // Start from the first day of the *previous* month
    setLocalStartDate(startDate);
    setLocalEndDate(today);
    setReportMode("1month");
    setShowDatePicker(false);

    // Notify parent to fetch fresh data - ensure dates are Date objects
    if (onDateChange) {
      onDateChange({
        startDate: startDate,
        endDate: today,
      });
    }

    try {
      const reportDate = new Date();
      const month = reportDate.toLocaleString("en-US", { month: "long" });
      const year = reportDate.getFullYear();

      const queryParams = new URLSearchParams({
        locationId: locationId,
        reportMonth: month,
        reportYear: String(year),
        _t: Date.now(),
      });

      const fetchUrl = `/api/performance-insights?${queryParams.toString()}`;

      const fetchResponse = await fetch(fetchUrl, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (fetchResponse.ok) {
        const fetchedData = await fetchResponse.json();
        if (fetchedData.success && fetchedData.data && fetchedData.data.length > 0) {
          const latestRecord = fetchedData.data[0];
          setDisplayData(latestRecord);
          setLastUpdated(new Date());
          toast.success("✓ Loaded last 1 month data!", { id: "1-month" });
        }
      }
    } catch (error) {
      console.error("Error loading 1 month data:", error);
      toast.error("Failed to load data", { id: "1-month" });
    }
  };

  const handleLast6Months = async () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    // Properly handle month subtraction to go back 6 months
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    // If the month didn't roll back correctly (e.g., Jan 31 -> Feb 28), adjust
    if (sixMonthsAgo.getMonth() > today.getMonth()) {
      sixMonthsAgo.setDate(0); // Go to last day of previous month
    }

    setLocalStartDate(sixMonthsAgo);
    setLocalEndDate(today);
    setReportMode("6months");
    setShowDatePicker(false);

    // Notify parent to fetch fresh data for 6-month period
    if (onDateChange) {
      onDateChange({
        startDate: sixMonthsAgo,
        endDate: today,
      });
    }

    // Also try to fetch from API if we have the needed params
    try {
      const reportDate = new Date(today);
      const month = reportDate.toLocaleString("en-US", { month: "long" });
      const year = reportDate.getFullYear();

      const queryParams = new URLSearchParams({
        locationId: locationId,
        reportMonth: month,
        reportYear: String(year),
        _t: Date.now(),
      });

      const fetchUrl = `/api/performance-insights?${queryParams.toString()}`;

      const fetchResponse = await fetch(fetchUrl, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (fetchResponse.ok) {
        const fetchedData = await fetchResponse.json();
        if (fetchedData.success && fetchedData.data && fetchedData.data.length > 0) {
          const latestRecord = fetchedData.data[0];
          setDisplayData(latestRecord);
          setLastUpdated(new Date());
          toast.success("✓ Loaded 6 month report data!", { id: "6-months" });
        }
      }
    } catch (error) {
      console.error("Error loading 6 months data:", error);
      toast.error("Failed to load data", { id: "6-months" });
    }
  };

  const handleRefreshData = useCallback(async () => {
    try {
      const reportDate = new Date(localEndDate);
      const month = reportDate.toLocaleString("en-US", { month: "long" });
      const year = reportDate.getFullYear();

      const queryParams = new URLSearchParams({
        locationId: locationId,
        reportMonth: month,
        reportYear: String(year),
        _t: Date.now(), // Cache busting - always get fresh data from server
      });

      const fetchUrl = `/api/performance-insights?${queryParams.toString()}`;

      const fetchResponse = await fetch(fetchUrl, {
        cache: "no-store", // Force fresh data from server
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!fetchResponse.ok) {
        console.error(`Fetch failed: ${fetchResponse.status}`);
        return;
      }

      const fetchedData = await fetchResponse.json();

      if (fetchedData.success && fetchedData.data && fetchedData.data.length > 0) {
        const latestRecord = fetchedData.data[0];
        setDisplayData(latestRecord);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [locationId, localEndDate]);

  // Auto-refresh data every 10 seconds if modal is open and auto-refresh is enabled
  useEffect(() => {
    if (!isOpen || !autoRefreshEnabled || !displayData) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      return;
    }

    // Set up auto-refresh interval (NOT calling handleRefreshData directly in the effect)
    autoRefreshIntervalRef.current = setInterval(() => {
      handleRefreshData();
    }, 10000); // Refresh every 10 seconds instead of 5

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [isOpen, autoRefreshEnabled, handleRefreshData]);

  const currentStartDate = dateRange?.startDate ? new Date(dateRange.startDate) : localStartDate;
  const currentEndDate = dateRange?.endDate ? new Date(dateRange.endDate) : localEndDate;

  return !isOpen ? null : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[92vh] overflow-hidden border border-black/5 animate-scaleUp">
        {/* Header */}
        <div className="bg-black text-white px-6 sm:px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <BarChart3 className="text-black w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl text-white font-black uppercase tracking-tight leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                {businessName}
              </h2>
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest opacity-80">{locationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-black/5 bg-slate-50 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="btn-ghost btn-sm gap-2"
            >
              <Calendar size={14} className="text-yellow-500" />
              <span>Custom Range</span>
            </button>

            <button
              onClick={handleLast1Month}
              className={`btn-sm rounded-xl px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${reportMode === "1month" ? "bg-black text-yellow-400" : "bg-white text-slate-400 border border-black/5 hover:border-yellow-400"}`}
            >
              1 Month Report
            </button>

            <button
              onClick={handleLast6Months}
              className={`btn-sm rounded-xl px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${reportMode === "6months" ? "bg-black text-yellow-400" : "bg-white text-slate-400 border border-black/5 hover:border-yellow-400"}`}
            >
              6 Month Report
            </button>

            <div className="h-6 w-px bg-black/10 mx-2 hidden sm:block" />

            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`btn-sm rounded-xl px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all duration-300 flex items-center gap-2 ${autoRefreshEnabled ? "bg-green-500 text-white" : "bg-white text-slate-400 border border-black/5 hover:border-yellow-400"}`}
            >
              {autoRefreshEnabled ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Auto-Sync ON
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Auto-Sync
                </>
              )}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={loading || isDownloading || !displayData}
              className="btn-lemon px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest gap-2 shadow-xl hover:scale-[1.02]"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin text-black" />
              ) : (
                <Download size={14} />
              )}
              {isDownloading ? "Generating..." : "Download Report ↗"}
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="px-8 py-6 border-b border-black/5 bg-yellow-400/5 animate-slideDown">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-4">Select Custom Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStartDate.toISOString().split("T")[0]}
                  onChange={(e) => setLocalStartDate(new Date(e.target.value))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEndDate.toISOString().split("T")[0]}
                  onChange={(e) => setLocalEndDate(new Date(e.target.value))}
                  className="input w-full"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  onClick={handleApplyDateRange}
                  className="btn-lemon flex-1 py-3.5 rounded-xl text-[10px] uppercase font-black"
                >
                  Apply Filter
                </button>
                <button
                  onClick={handleResetDateRange}
                  className="btn-ghost flex-1 py-3.5 rounded-xl text-[10px] uppercase font-black"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8 custom-scroll">
          {loading || isSaving ? (
            <div className="h-full flex items-center justify-center min-h-100">
              <div className="text-center bg-white p-12 rounded-4xl shadow-xl border border-black/5 flex flex-col items-center">
                <Loader2 size={50} className="text-yellow-500 animate-spin mb-6" strokeWidth={3} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  {isSaving ? "Saving Report..." : "Generating Insights..."}
                </p>
              </div>
            </div>
          ) : !displayData ? (
            <div className="h-full flex items-center justify-center min-h-100">
              <div className="text-center bg-white p-12 rounded-4xl border border-black/5 max-w-md shadow-lg">
                <AlertCircle className="mx-auto mb-6 text-yellow-500" size={48} />
                <h3 className="text-black font-black uppercase tracking-tight mb-2">No Data Found</h3>
                <p className="text-slate-400 font-bold text-sm">
                  Please select a valid date range and try again.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-4xl shadow-2xl overflow-hidden border border-black/5">
              <PerformanceInsightsReport
                ref={reportRef}
                insightsData={displayData.insightsData}
                businessName={displayData.businessName}
                locationName={displayData.locationName}
                city={displayData.city || ""}
                locality={displayData.locality || ""}
                dateRange={{
                  startDate: new Date(displayData.dateRange.startDate),
                  endDate: new Date(displayData.dateRange.endDate),
                }}
                storedMetrics={displayData.metrics}
                searchKeywords={displayData.searchKeywords || searchKeywords}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceInsightsModal;
