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
import { fetchLocationInsights } from "@/lib/gmb-api";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
function InsightsModal({ isOpen, onClose, insights, listingTitle, loading, startDate, endDate, onDateChange, searchKeywords, searchKeywordsLoading }) {
  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    const element = document.getElementById("insights-modal-content");
    if (!element) {
      toast.error("Content not found for PDF generation.");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-toast" });

    const scrollContainer = document.getElementById("insights-scroll-container");
    let originalScrollHeight = '';
    let originalScrollOverflow = '';
    let originalRootMaxHeight = '';
    let originalRootOverflow = '';

    try {
      if (scrollContainer) {
        originalScrollHeight = scrollContainer.style.height;
        originalScrollOverflow = scrollContainer.style.overflow;
        scrollContainer.style.height = 'auto';
        scrollContainer.style.overflow = 'visible';
      }
      
      originalRootMaxHeight = element.style.maxHeight;
      originalRootOverflow = element.style.overflow;
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';

      const dataUrl = await toPng(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      if (scrollContainer) {
        scrollContainer.style.height = originalScrollHeight;
        scrollContainer.style.overflow = originalScrollOverflow;
      }
      element.style.maxHeight = originalRootMaxHeight;
      element.style.overflow = originalRootOverflow;

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`GMB-Insights-${listingTitle.replace(/\s+/g, "-")}.pdf`);
      toast.success("PDF Downloaded!", { id: "pdf-toast" });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF.", { id: "pdf-toast" });
      
      if (scrollContainer) {
        scrollContainer.style.height = originalScrollHeight;
        scrollContainer.style.overflow = originalScrollOverflow;
      }
      element.style.maxHeight = originalRootMaxHeight;
      element.style.overflow = originalRootOverflow;
    }
  };

  const calculateTotal = (metricData) => {
    if (!metricData || !metricData.timeSeries || !metricData.timeSeries.datedValues) {
      return 0;
    }
    return metricData.timeSeries.datedValues.reduce((sum, item) => {
      const value = typeof item.value === 'string' ? parseInt(item.value, 10) : (item.value || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  const getMetricByType = (type) => {
    if (!insights || !insights.multiDailyMetricTimeSeries) return null;
    
    if (insights.multiDailyMetricTimeSeries[0]?.dailyMetricTimeSeries) {
      const series = insights.multiDailyMetricTimeSeries[0].dailyMetricTimeSeries.find(
        m => m.dailyMetric === type
      );
      return series;
    } else {
      return insights.multiDailyMetricTimeSeries.find(m => m.dailyMetric === type);
    }
  };

  const directionRequests = getMetricByType("BUSINESS_DIRECTION_REQUESTS");
  const callClicks = getMetricByType("CALL_CLICKS");
  const websiteClicks = getMetricByType("WEBSITE_CLICKS");
  const mapsImpressions = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const searchImpressions = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");

  const totalDirections = calculateTotal(directionRequests);
  const totalCalls = calculateTotal(callClicks);
  const totalWebsiteClicks = calculateTotal(websiteClicks);
  const totalMapsImpressions = calculateTotal(mapsImpressions);
  const totalSearchImpressions = calculateTotal(searchImpressions);
  const totalImpressions = totalMapsImpressions + totalSearchImpressions;

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysDifference = () => {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const topKeywords = searchKeywords?.searchKeywordsCounts 
    ? searchKeywords.searchKeywordsCounts
        .sort((a, b) => {
          const aValue = a.insightsValue?.value || 0;
          const bValue = b.insightsValue?.value || 0;
          return bValue - aValue;
        })
        .slice(0, 10)
    : [];

  const chartData = React.useMemo(() => {
    if (!insights) return [];
    
    const directions = getMetricByType("BUSINESS_DIRECTION_REQUESTS")?.timeSeries?.datedValues || [];
    const calls = getMetricByType("CALL_CLICKS")?.timeSeries?.datedValues || [];
    const website = getMetricByType("WEBSITE_CLICKS")?.timeSeries?.datedValues || [];
    const maps = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS")?.timeSeries?.datedValues || [];
    const search = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH")?.timeSeries?.datedValues || [];

    const dataMap = new Map();

    const addData = (series, key) => {
      if (!series) return;
      series.forEach(d => {
        const dateKey = `${d.date.year}-${d.date.month}-${d.date.day}`;
        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, {
            date: new Date(d.date.year, d.date.month - 1, d.date.day),
            displayDate: `${d.date.day}/${d.date.month}`,
          });
        }
        dataMap.get(dateKey)[key] = parseInt(d.value || 0);
      });
    };

    addData(directions, 'Directions');
    addData(calls, 'Calls');
    addData(website, 'Website');
    addData(maps, 'Maps');
    addData(search, 'Search');

    return Array.from(dataMap.values()).sort((a, b) => a.date - b.date);
  }, [insights]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        id="insights-modal-content"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Performance Insights</h2>
              <p className="text-sm text-blue-100">{listingTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              title="Download as PDF"
            >
              <Download className="w-6 h-6" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div id="insights-scroll-container" className="p-6 overflow-y-auto flex-1">

          {/* DATE RANGE */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Select Date Range</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formatDate(startDate)}
                  onChange={(e) => onDateChange(new Date(e.target.value), endDate)}
                  max={formatDate(endDate)}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formatDate(endDate)}
                  onChange={(e) => onDateChange(startDate, new Date(e.target.value))}
                  min={formatDate(startDate)}
                  max={formatDate(new Date())}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Showing data for {getDaysDifference()} days</span>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CircularProgress size={50} thickness={4} sx={{ color: "#3b82f6" }} />
              <p className="text-gray-600 mt-4 font-semibold">Loading insights...</p>
            </div>
          ) : insights && insights.multiDailyMetricTimeSeries ? (
            <>
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-600 p-3 rounded-lg">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-purple-700">
                      {totalImpressions.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Total Impressions</h3>
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span>Maps: {totalMapsImpressions.toLocaleString()}</span>
                    <span>•</span>
                    <span>Search: {totalSearchImpressions.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <MousePointer className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-blue-700">
                      {totalWebsiteClicks.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Website Clicks</h3>
                  <p className="text-xs text-gray-600">Users visited your website</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-600 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-green-700">
                      {totalCalls.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Call Clicks</h3>
                  <p className="text-xs text-gray-600">Users clicked to call</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-5 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-orange-600 p-3 rounded-lg">
                      <Navigation className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-orange-700">
                      {totalDirections.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Direction Requests</h3>
                  <p className="text-xs text-gray-600">Users requested directions</p>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    Visibility Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorMaps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="displayDate" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{fontSize: '12px'}} />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                        <Area type="monotone" dataKey="Maps" stroke="#9333ea" fillOpacity={1} fill="url(#colorMaps)" name="Maps Views" />
                        <Area type="monotone" dataKey="Search" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSearch)" name="Search Views" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-blue-600" />
                    Engagement Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="displayDate" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{fontSize: '12px'}} />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                        <Line type="monotone" dataKey="Website" stroke="#2563eb" strokeWidth={2} dot={false} name="Website Clicks" />
                        <Line type="monotone" dataKey="Calls" stroke="#16a34a" strokeWidth={2} dot={false} name="Calls" />
                        <Line type="monotone" dataKey="Directions" stroke="#ea580c" strokeWidth={2} dot={false} name="Directions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* KEYWORDS */}
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-600" />
                  Top Search Keywords
                </h3>

                {searchKeywordsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <CircularProgress size={40} thickness={4} sx={{ color: "#0891b2" }} />
                  </div>
                ) : topKeywords.length > 0 ? (
                  <div className="space-y-3">
                    {topKeywords.map((keyword, idx) => {
                      const value = keyword.insightsValue?.value || 0;
                      const maxValue = topKeywords[0]?.insightsValue?.value || 1;
                      const percentage = (value / maxValue) * 100;

                      return (
                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-gray-900">{keyword.searchKeyword}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-cyan-600" />
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-cyan-700">{value.toLocaleString()}</span>
                                <span className="text-xs text-gray-500">Impressions</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No search keyword data available</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Insights Available</h3>
              <p className="text-gray-600">Unable to load performance data for this listing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
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

  // Handle View Insights
  const handleViewInsights = async (location) => {
    setShowInsightsModal(true);
    setInsightsLoading(true);
    setSearchKeywordsLoading(true);
    setInsightsData(null);
    setSearchKeywordsData(null);
    setSelectedListingTitle(location.title || "Unknown Listing");

    try {
      const insights = await fetchLocationInsights(session.accessToken, location.locationId, startDate, endDate);
      setInsightsData(insights);
      setInsightsLoading(false);

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
      setSearchKeywordsLoading(false);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights. Please try again.");
      setInsightsLoading(false);
      setSearchKeywordsLoading(false);
    }
  };

  // Handle date change in modal
  const handleDateChange = async (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    setInsightsLoading(true);
    try {
      const insights = await fetchLocationInsights(
        session.accessToken, 
        locations.find(l => l.title === selectedListingTitle)?.locationId, 
        newStartDate, 
        newEndDate
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
