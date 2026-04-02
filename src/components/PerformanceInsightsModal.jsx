"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import PerformanceInsightsReport from "./PerformanceInsightsReport";
import { generatePerformanceInsightsPDF } from "@/lib/performancePdfGenerator";
import { savePerformanceInsights, calculateMetricsInRange } from "@/lib/performanceInsightsUtils";
import CircularProgress from "@mui/material/CircularProgress";

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
  const [localStartDate, setLocalStartDate] = useState(
    dateRange?.startDate ? new Date(dateRange.startDate) : (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
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
    <div className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
<div
  className="text-white flex justify-between items-center border-b"
  style={{
    backgroundColor: "#2563eb",
    borderColor: "#1e40af",
    padding: "20px"
  }}
>        <div className="flex items-center gap-3">
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
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
          {/* Filter Section Header */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Report Options</p>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.backgroundColor = "#eff6ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              📅 Change Date Range
            </button>

            <button
              onClick={handleLast1Month}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: reportMode === "1month" ? "#eff6ff" : "#ffffff",
                border: `2px solid ${reportMode === "1month" ? "#3b82f6" : "#e5e7eb"}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: reportMode === "1month" ? "#1d4ed8" : "#374151",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (reportMode !== "1month") {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.backgroundColor = "#f0f9ff";
                }
              }}
              onMouseLeave={(e) => {
                if (reportMode !== "1month") {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              📊 Last 1 Month
            </button>

            <button
              onClick={handleLast6Months}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: reportMode === "6months" ? "#fff7ed" : "#ffffff",
                border: `2px solid ${reportMode === "6months" ? "#f97316" : "#e5e7eb"}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: reportMode === "6months" ? "#c2410c" : "#374151",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (reportMode !== "6months") {
                  e.currentTarget.style.borderColor = "#fed7aa";
                  e.currentTarget.style.backgroundColor = "#fef3c7";
                }
              }}
              onMouseLeave={(e) => {
                if (reportMode !== "6months") {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              📈 6 Month Report
            </button>

            <div style={{ borderLeft: "1px solid #e5e7eb", height: 20, margin: "0 6px" }} />

            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: autoRefreshEnabled ? "#f0fdf4" : "#ffffff",
                border: `2px solid ${autoRefreshEnabled ? "#16a34a" : "#e5e7eb"}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: autoRefreshEnabled ? "#15803d" : "#374151",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!autoRefreshEnabled) {
                  e.currentTarget.style.borderColor = "#86efac";
                  e.currentTarget.style.backgroundColor = "#f0fdf4";
                }
              }}
              onMouseLeave={(e) => {
                if (!autoRefreshEnabled) {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              {autoRefreshEnabled ? (
                <>
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Auto-Refresh ON
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Auto-Refresh
                </>
              )}
            </button>

            <button
              onClick={() => {
                handleRefreshData();
                toast.success("✓ Data refreshed!", { id: "manual-refresh" });
              }}
              disabled={lastUpdated && (Date.now() - lastUpdated.getTime()) < 2000}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "#ffffff",
                border: "2px solid #3b82f6",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#1d4ed8",
                cursor: lastUpdated && (Date.now() - lastUpdated.getTime()) < 2000 ? "not-allowed" : "pointer",
                opacity: lastUpdated && (Date.now() - lastUpdated.getTime()) < 2000 ? 0.5 : 1,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!(lastUpdated && (Date.now() - lastUpdated.getTime()) < 2000)) {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              <RefreshCw size={14} />
              Refresh Now
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={loading || isDownloading || !displayData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "#2563eb",
                border: "2px solid transparent",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                cursor: loading || isDownloading || !displayData ? "not-allowed" : "pointer",
                opacity: loading || isDownloading || !displayData ? 0.5 : 1,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!(loading || isDownloading || !displayData)) {
                  e.currentTarget.style.background = "#1d4ed8";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2563eb";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.3)";
              }}
            >
              {isDownloading ? (
                <CircularProgress size={14} sx={{ color: "white" }} />
              ) : (
                <Download size={14} />
              )}
              {isDownloading ? "Generating..." : "Download PDF"}
            </button>

            {lastUpdated && (
              <div style={{
                marginLeft: "auto",
                fontSize: 11,
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "8px 12px",
                borderRadius: 8,
                fontWeight: 600,
                border: "1px solid #bfdbfe",
              }}>
                ✓ Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
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
