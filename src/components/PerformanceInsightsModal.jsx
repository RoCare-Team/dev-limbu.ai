"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import PerformanceInsightsReport from "./PerformanceInsightsReport";
import { generatePerformanceInsightsPDF } from "@/lib/performancePdfGenerator";
import { savePerformanceInsights, calculateMetrics } from "@/lib/performanceInsightsUtils";
import CircularProgress from "@mui/material/CircularProgress";

const PerformanceInsightsModal = ({
  isOpen,
  onClose,
  insightsData,
  businessName,
  locationName,
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
  const [localStartDate, setLocalStartDate] = useState(
    dateRange?.startDate ? new Date(dateRange.startDate) : (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
      date.setMonth(date.getMonth() - 1); // Go to first day of previous month
      return date;
    })()
  );
  const [localEndDate, setLocalEndDate] = useState(dateRange?.endDate ? new Date(dateRange.endDate) : new Date());
  const [reportMode, setReportMode] = useState("1month"); // "1month" or "6months"

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
      
      // Calculate metrics from fresh data
      const metrics = calculateMetrics(insightsData);
      
      // Update display with fresh data directly
      setDisplayData(prev => ({
        ...prev,
        insightsData: insightsData,
        searchKeywords: searchKeywords,
        metrics: metrics,
        dateRange: {
          startDate: localStartDate.toISOString(),
          endDate: localEndDate.toISOString(),
        },
        businessName: businessName,
        locationName: locationName,
      }));
      
      setLastUpdated(new Date());
    }
  }, [insightsData, isOpen]);

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
          const metrics = calculateMetrics(insightsData);

          const insightsPayload = {
            locationId,
            businessName,
            locationName,
            businessProfileId,
            insightsData,
            searchKeywords,
            dateRange: {
              startDate: localStartDate.toISOString(),
              endDate: localEndDate.toISOString(),
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
  }, [isOpen, insightsData, loading, locationId, businessName, locationName, businessProfileId, searchKeywords, hasAutoSavedThisSession]);

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

      await generatePerformanceInsightsPDF(reportRef.current, metadata);
      
      toast.success(
        `✓ PDF Downloaded! (Calls: ${displayData.metrics?.totalCalls || 0}, Maps: ${displayData.metrics?.totalMapsImpressions || 0})`,
        { id: "download-success", duration: 4000 }
      );
      setIsDownloading(false);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF");
      setIsDownloading(false);
    }
  };

  const handleApplyDateRange = () => {
    if (onDateChange) {
      onDateChange({
        startDate: localStartDate,
        endDate: localEndDate,
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
    const date = new Date();
    date.setDate(1); // First day of current month
    date.setMonth(date.getMonth() - 1); // Go to first day of previous month
    setLocalStartDate(date);
    setLocalEndDate(new Date());
    setReportMode("1month");
    setShowDatePicker(false);

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
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="text-white px-6 py-5 flex justify-between items-center border-b" style={{ backgroundColor: "#2563eb", borderColor: "#1e40af" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              📊
            </div>
            <div>
              <h2 className="text-2xl font-bold">{businessName}</h2>
              <p className="text-blue-100 text-sm">{locationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div c lassName="px-6 py-4 border-b border-gray-200 flex gap-3 items-center flex-wrap" style={{ backgroundColor: "#f9fafb" }}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-700 font-medium"
          >
            <Calendar size={18} />
            Change Date Range
          </button>

          <button
            onClick={handleLast1Month}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-700 font-medium"
            style={{
              borderColor: reportMode === "1month" ? "#2563eb" : "#93c5fd",
              backgroundColor: reportMode === "1month" ? "#eff6ff" : "#ffffff",
            }}
          >
            📅 Last 1 Month
          </button>

          <button
            onClick={handleLast6Months}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-orange-700 font-medium"
            style={{
              borderColor: reportMode === "6months" ? "#ea580c" : "#fdba74",
              backgroundColor: reportMode === "6months" ? "#fff7ed" : "#ffffff",
            }}
          >
            📊 6 Month Report
          </button>

          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg transition-all text-gray-700 font-medium"
            style={{
              borderColor: autoRefreshEnabled ? "#10b981" : "#d1d5db",
              backgroundColor: autoRefreshEnabled ? "#ecfdf5" : "#f9fafb",
              color: autoRefreshEnabled ? "#059669" : "#6b7280",
            }}
          >
            {autoRefreshEnabled ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Auto-Refresh ON (10s)
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Auto-Refresh OFF
              </>
            )}
          </button>

          <button
            onClick={() => {
              handleRefreshData();
              toast.success("✓ Data refreshed!", { id: "manual-refresh" });
            }}
            disabled={lastUpdated && (Date.now() - lastUpdated.getTime()) < 2000}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} />
            Refresh Now
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading || isDownloading || !displayData}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#2563eb" }}
          >
            {isDownloading ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              <Download size={18} />
            )}
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </button>

          {lastUpdated && (
            <div className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: "#eff6ff" }}>
            <h3 className="font-bold text-gray-800 mb-4">Select Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStartDate.toISOString().split("T")[0]}
                  onChange={(e) => setLocalStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEndDate.toISOString().split("T")[0]}
                  onChange={(e) => setLocalEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyDateRange}
                  className="flex-1 px-4 py-2 text-white rounded-lg transition font-medium"
                  style={{ backgroundColor: "#2563eb" }}
                >
                  Apply
                </button>
                <button
                  onClick={handleResetDateRange}
                  className="flex-1 px-4 py-2 text-gray-700 rounded-lg transition font-medium"
                  style={{ backgroundColor: "#d1d5db" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {loading || isSaving ? (
            <div className="h-full flex items-center justify-center min-h-96">
              <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <CircularProgress size={60} sx={{ color: "#2563eb", marginBottom: "16px" }} />
                <p className="text-gray-600 font-medium">
                  {isSaving ? "Saving to database..." : "Loading performance insights..."}
                </p>
              </div>
            </div>
          ) : !displayData ? (
            <div className="h-full flex items-center justify-center min-h-96">
              <div className="text-center bg-white p-8 rounded-xl border-2 border-yellow-300 max-w-md shadow-lg">
                <AlertCircle className="mx-auto mb-4 text-yellow-600" size={48} />
                <p className="text-gray-700 font-semibold">No insights data available</p>
                <p className="text-gray-500 text-sm mt-2">
                  Please select a valid date range and try again
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <PerformanceInsightsReport
                ref={reportRef}
                insightsData={displayData.insightsData}
                businessName={displayData.businessName}
                locationName={displayData.locationName}
                dateRange={{
                  startDate: new Date(displayData.dateRange.startDate),
                  endDate: new Date(displayData.dateRange.endDate),
                }}
                storedMetrics={displayData.metrics}
                searchKeywords={searchKeywords}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceInsightsModal;
