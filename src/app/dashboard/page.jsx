"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";
import {
  MapPin,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Building2,
  Plus,
  TrendingUp,
  Eye,
  MousePointer,
  Navigation,
  BarChart3,
  X,
  Calendar,
  Menu,
  Search,
  Hash,
  LayoutDashboard,
  PlusSquare,
  QrCode,
  Wallet,
  RefreshCw,
  Rocket,
  Download,
  Activity,
  Facebook,
  Instagram,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FirstPostModal from "../../components/FirstPostModal";

import Link from "next/link";
import { fetchAllPostsAction } from "../actions/postActions";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import MetaConnectCard from "../../components/MetaConnectCard";

// --- API Helpers ---
export async function fetchGMBAccounts(accessToken) {
  try {
    const res = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch accounts: ${errText}`);
    }

    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error("Fetch Accounts Error:", err);
    throw err;
  }
}

export async function fetchAllLocationsByAccount(accessToken, accountId) {
  try {
    let allLocations = [];
    let pageToken = null;

    do {
      let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error(`Failed to fetch locations for account ${accountId}`);

      const data = await res.json();
      
      if (data.locations && data.locations.length > 0) {
        allLocations = [...allLocations, ...data.locations];
      }
      
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allLocations;
  } catch (err) {
    console.error(`Error fetching locations for account ${accountId}:`, err);
    throw err;
  }
}

export async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const res = await fetch(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
  }
}

// --- Admin Storage Helper ---
export async function storeUserListingsForAdmin(userEmail, listings) {
  
  
  try {
    const response = await fetch('/api/admin/saveBussiness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        listings,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store listings for admin');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error storing listings for admin:', error);
    // Don't throw error - admin storage failure shouldn't break user experience
  }
}

// --- Fetch Insights API ---
export async function fetchLocationInsights(accessToken, locationId, startDate, endDate) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

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

// --- Fetch Search Keywords API ---
export async function fetchSearchKeywords(accessToken, locationId, startMonth, endMonth) {
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

// --- Insights Modal Component ---
function InsightsModal({ isOpen, onClose, insights, listingTitle, loading, startDate, endDate, onDateChange, searchKeywords, searchKeywordsLoading }) {
  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    const element = document.getElementById("insights-modal-content");
    if (!element) {
      toast.error("Content not found for PDF generation.");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-toast" });

    // Store original styles to restore later
    const scrollContainer = document.getElementById("insights-scroll-container");
    let originalScrollHeight = '';
    let originalScrollOverflow = '';
    let originalRootMaxHeight = '';
    let originalRootOverflow = '';

    try {
      // Temporarily expand the container to capture full content
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
        pixelRatio: 2, // For better resolution
      });

      // Restore styles
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
      
      // Restore styles in case of error
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
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 animate-fadeIn mt-10 sm:mt-14">
  <div
      id="insights-modal-content"
      className="
      bg-white rounded-2xl shadow-2xl 
      w-full max-w-5xl 
      max-h-[92vh] 
      flex flex-col 
      overflow-hidden
    ">

    {/* HEADER */}
    <div className="
        bg-gradient-to-r from-blue-600 to-purple-600 text-white 
        px-4 sm:px-6 py-4 
        flex justify-between items-center 
        rounded-t-2xl 
        flex-shrink-0
      ">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Performance Insights</h2>
          <p className="text-xs sm:text-sm text-blue-100">{listingTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDownloadPDF}
          className="hover:bg-white/20 p-2 rounded-lg transition"
          title="Download as PDF"
        >
          <Download className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={onClose}
          className="hover:bg-white/20 p-2 rounded-lg transition"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>

    {/* BODY */}
    <div id="insights-scroll-container" className="p-4 sm:p-6 overflow-y-auto flex-1">

      {/* DATE RANGE */}
      <div className="
            bg-gradient-to-br from-blue-50 to-purple-50 
            border-2 border-blue-200 rounded-xl 
            p-4 sm:p-5 mb-6
          ">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Select Date Range
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formatDate(startDate)}
              onChange={(e) => onDateChange(new Date(e.target.value), endDate)}
              max={formatDate(endDate)}
              className="
                w-full px-3 py-2 sm:px-4 sm:py-2 
                border-2 border-blue-300 
                rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formatDate(endDate)}
              onChange={(e) => onDateChange(startDate, new Date(e.target.value))}
              min={formatDate(startDate)}
              max={formatDate(new Date())}
              className="
                w-full px-3 py-2 sm:px-4 sm:py-2 
                border-2 border-blue-300 
                rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
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

            {/* TOTAL IMPRESSIONS */}
            <div className="
                bg-gradient-to-br from-purple-50 to-purple-100 
                border-2 border-purple-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              ">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-purple-700">
                  {totalImpressions.toLocaleString()}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Total Impressions
              </h3>

              <div className="flex gap-2 text-xs text-gray-600">
                <span>Maps: {totalMapsImpressions.toLocaleString()}</span>
                <span>•</span>
                <span>Search: {totalSearchImpressions.toLocaleString()}</span>
              </div>
            </div>

            {/* WEBSITE CLICKS */}
            <div className="
                bg-gradient-to-br from-blue-50 to-blue-100 
                border-2 border-blue-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              ">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <MousePointer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-blue-700">
                  {totalWebsiteClicks.toLocaleString()}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Website Clicks
              </h3>

              <p className="text-xs text-gray-600">Users visited your website</p>
            </div>

            {/* CALL CLICKS */}
            <div className="
                bg-gradient-to-br from-green-50 to-green-100 
                border-2 border-green-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              ">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-600 p-3 rounded-lg">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-green-700">
                  {totalCalls.toLocaleString()}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Call Clicks
              </h3>

              <p className="text-xs text-gray-600">Users clicked to call</p>
            </div>

            {/* DIRECTIONS */}
            <div className="
                bg-gradient-to-br from-orange-50 to-orange-100 
                border-2 border-orange-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              ">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-600 p-3 rounded-lg">
                  <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-orange-700">
                  {totalDirections.toLocaleString()}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Direction Requests
              </h3>

              <p className="text-xs text-gray-600">Users requested directions</p>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Visibility Chart */}
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
                    <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                    <Area type="monotone" dataKey="Maps" stroke="#9333ea" fillOpacity={1} fill="url(#colorMaps)" name="Maps Views" />
                    <Area type="monotone" dataKey="Search" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSearch)" name="Search Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Chart */}
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

          {/* ENGAGEMENT SUMMARY */}
          <div className="
              bg-gradient-to-br from-indigo-50 to-indigo-100 
              border-2 border-indigo-200 rounded-xl 
              p-4 sm:p-6 mb-6
            ">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Engagement Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {totalImpressions.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Views</div>
              </div>

              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {totalImpressions > 0
                    ? (((totalWebsiteClicks + totalCalls + totalDirections) / totalImpressions) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
                <div className="text-xs text-gray-600 mt-1">Click Rate</div>
              </div>

              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {(totalWebsiteClicks + totalCalls + totalDirections).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Actions</div>
              </div>

              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {getDaysDifference()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Days</div>
              </div>
            </div>
          </div>

          {/* KEYWORDS */}
          <div className="
              bg-gradient-to-br from-cyan-50 to-cyan-100 
              border-2 border-cyan-200 rounded-xl 
              p-4 sm:p-6 mb-6
            ">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
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

          {/* RECENT DAILY ACTIVITY */}
          {callClicks?.timeSeries?.datedValues && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Daily Activity</h3>
              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {callClicks.timeSeries.datedValues.slice(-10).reverse().map((item, idx) => {
                    const date = item.date;
                    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                    const value = typeof item.value === 'string' ? parseInt(item.value, 10) : (item.value || 0);

                    return (
                      <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <span className="text-sm font-medium text-gray-700">{dateStr}</span>
                        <span className="text-sm font-bold text-blue-600">{value} calls</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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

// --- Connect Business Modal ---
function ConnectModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000); // Auto-close after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 sm:p-10 relative transform transition-all animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
          <Rocket className="h-8 w-8 text-blue-600" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Connect Your Business
            <span className="block text-lg sm:text-xl text-gray-600 font-medium mt-1">— Hassle-Free & Instantly</span>
          </h2>
          <p className="text-gray-600 mb-8 text-sm sm:text-base max-w-sm mx-auto">
            Securely link your Google Business Profile with a single click to unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-95 transition-opacity text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" fill="currentColor"><path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" /></svg>
            Connect Now with Bussiness
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard Component ---
export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, verified: 0, unverified: 0, pending: 0 });
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedListingTitle, setSelectedListingTitle] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [noAccountsFound, setNoAccountsFound] = useState(false);
  const [searchKeywordsData, setSearchKeywordsData] = useState(null);
  const [searchKeywordsLoading, setSearchKeywordsLoading] = useState(false);
  const [facebookPages, setFacebookPages] = useState([]);
  const [cacheStatus, setCacheStatus] = useState(""); // For showing cache info
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);  
  const [showFirstPostModal, setShowFirstPostModal] = useState(false);
  const [FbPageData,setFbPageData] = useState([])


  const userId = localStorage.getItem("userId");

  
  const [insightsStartDate, setInsightsStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [insightsEndDate, setInsightsEndDate] = useState(new Date());

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

const navItems = [
  //  {
  //   href: "/checkHealth",
  //   icon: <PlusSquare className="h-6 w-6" />,
  //   label: "Check Health",
  // },
  {
    href: "/post-management",
    icon: <PlusSquare className="h-6 w-6" />,
    label: "Create & Publish Post",
  },
  {
    href: "/review-management",
    icon: <Star className="h-6 w-6" />,
    label: "Review Reply",
  },
  {
    href: "/get-magic-qr",
    icon: <QrCode className="h-6 w-6" />,
    label: "Magic QR",
  },
  {
    href: "/wallet",
    icon: <Wallet className="h-6 w-6" />,
    label: "Wallet Recharge",
  },
  {
    href: "/gmb-health",
    icon: <Activity className="h-6 w-6" />,
    label: "GMB Health",
  },
];


const NavLinks = ({ isAuthenticated }) => {
  return (
    <div className="w-full max-w-3xl px-1 py-2 bg-transparent">

      <div
        className="
          grid
          grid-cols-4                      /* mobile always 4 */
          sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))] 
          gap-4 sm:gap-6 
          place-items-center
        "
      >
        {navItems.map((item) => {
          const isPublic =
            item.href === "/post-management" || item.href === "/wallet";

          const isEnabled = isAuthenticated || isPublic;

          const FeatureIcon = (
            <div
              className={`
                flex flex-col items-center justify-center 
                space-y-1 p-1.5 sm:p-3 rounded-xl
                cursor-pointer transition-all
                ${pathname === item.href && isAuthenticated ? "scale-105" : ""}
              `}
              onClick={
                !isEnabled
                  ? () => signIn("google", { callbackUrl: item.href })
                  : undefined
              }
            >
              <div
                className={`
                  p-2.5 sm:p-4 rounded-2xl transition
                  ${
                    pathname === item.href && isAuthenticated
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700"
                  }
                `}
              >
                {item.icon}
              </div>

              <span className="text-[10px] sm:text-sm font-semibold text-gray-800 text-center leading-tight">
                {item.label}
              </span>
            </div>
          );

          if (isEnabled) {
            return (
              <Link key={item.label} href={item.href}>
                {FeatureIcon}
              </Link>
            );
          }

          return <div key={item.label}>{FeatureIcon}</div>;
        })}
      </div>
    </div>
  );
};



  const fetchInProgress = useRef(false);
  const dataCache = useRef({});

  // Enhanced cache with expiry time (10 minutes)
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  const getCacheKey = (email) => `gmb_data_${email}`;

  // Load from cache with status reporting
  const loadFromCache = useCallback((email) => {
    const cacheKey = getCacheKey(email);
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    
    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      const ageMinutes = Math.round(age / 60000);
      
      if (age < CACHE_EXPIRY_MS) {
        console.log(`✅ Loading from cache (${ageMinutes} min old):`, email);
        setAccounts(cached.accounts || []);
        setNoAccountsFound(cached.noAccountsFound || false);
        setInitialFetchDone(true);
        setCacheStatus(`Loaded from cache (${ageMinutes} min ago)`);
        
        return { loaded: true, needsRefresh: age > 5 * 60 * 1000 };
      } else {
        console.log("⚠️ Cache expired, will fetch fresh data");
        setCacheStatus("Cache expired, fetching fresh data...");
      }
    }
    return { loaded: false, needsRefresh: false };
  }, []);

  // Save to cache
  const saveToCache = useCallback((email, accountsData, noAccounts) => {
    const cacheKey = getCacheKey(email);
    const cacheData = {
      accounts: accountsData,
      noAccountsFound: noAccounts,
      timestamp: Date.now()
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    setCacheStatus("Data refreshed and cached");
  }, []);

  // Clear cache function
  const clearCache = useCallback(() => {
    sessionStorage.removeItem(getCacheKey(session?.user?.email));
    toast.success("Cache cleared successfully!");
    setCacheStatus("Cache cleared");
  }, []);

  // --- Fetch All Accounts & Locations ---
  const fetchInitialData = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!session?.accessToken || !session?.user?.email) {
      console.log("⚠️ No session or access token available");
      return;
    }
    
    const userEmail = session.user.email;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const { loaded, needsRefresh } = loadFromCache(userEmail);
      if (loaded) {
        if (needsRefresh) {
          toast.info("Cache data is old. Refreshing in background...", { duration: 2000 });
          setTimeout(() => fetchInitialData(true, true), 1000);
        }
        return;
      }
    }

    if (fetchInProgress.current && !forceRefresh) {
      console.log("⏳ Fetch already in progress, skipping...");
      return;
    }

    fetchInProgress.current = true;
    if (!isBackground) setLoading(true);
    setNoAccountsFound(false);
    if (!isBackground) setCacheStatus("Fetching fresh data from Google...");
    
    const token = session.accessToken;

    try {
      const accountsData = await fetchGMBAccounts(token);

      

      
      
      

      if (accountsData.length === 0) {
        console.log("❌ No accounts found for this user");
        setAccounts([]);
        setNoAccountsFound(true);
        saveToCache(userEmail, [], true);
        setInitialFetchDone(true);
        if (!isBackground) setLoading(false);
        fetchInProgress.current = false;
        setCacheStatus("No accounts found");
        return;
      }

      console.log(`🔄 Fetching locations for ${accountsData.length} accounts...`);

      const listingsPromises = accountsData.map(async (account) => {
        const accountId = account.name.replace("accounts/", "");
        const accountName = account.accountName;

        try {
          const locations = await fetchAllLocationsByAccount(token, accountId);

          if (locations && locations.length > 0) {
            const locationsWithVoM = await Promise.all(
              locations.map(async (loc) => {
                const vomStatus = await checkVoiceOfMerchant(token, loc.name);
                return {
                  ...loc,
                  accountId,
                  accountName: accountName || account.name,
                  hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
                  hasBusinessAuthority: vomStatus.hasBusinessAuthority,
                };
              })
            );
            return locationsWithVoM;
          }
        } catch (err) {
          console.error(`Error fetching locations for account ${accountName} (${accountId}):`, err);
        }
        return [];
      });

      const results = await Promise.all(listingsPromises);
      const allListings = results.flat();

      if (allListings.length > 0) {
        const newAccounts = [{ email: userEmail, listings: allListings }];
        setAccounts(newAccounts);
        setNoAccountsFound(false);
        saveToCache(userEmail, newAccounts, false);
        
        // Store for admin
        console.log("📤 Storing listings for admin dashboard...");
        await storeUserListingsForAdmin(userEmail, allListings);
        
        setCacheStatus(`${allListings.length} listings loaded and cached`);
      } else {
        console.log("❌ No locations found in any account");
        setAccounts([]);
        setNoAccountsFound(false);
        saveToCache(userEmail, [], false);
        setCacheStatus("No listings found");
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      toast.error("Failed to load listings. Please try again.");
      if (!isBackground) setNoAccountsFound(true);
      setCacheStatus("Error fetching data");
    }

    setInitialFetchDone(true);
    if (!isBackground) setLoading(false);
    fetchInProgress.current = false;
  }, [session?.accessToken, session?.user?.email, loadFromCache, saveToCache]);

  // --- Fetch Facebook Pages ---
  const fetchFacebookPages = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook/pages");
      const data = await res.json();
      console.log("datadata",data);
      
      if (data.success) {
        console.log("data",data);
        
        setFacebookPages(data.pages);
        // setFbPageData(data.pages)
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      toast.error("Failed to fetch Facebook pages");
    }
  }, []);

  useEffect(() => {
    fetchFacebookPages();
    if (searchParams?.get("fb") === "connected") {
      toast.success("Facebook Page connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchFacebookPages, searchParams, router]);



  useEffect(()=>{
    fetchInitialData()
  },[])

      useEffect(()=>{
        let timerId = null;
        const fetchPosts = async () => {
          try {
            const userId = localStorage.getItem("userId");
            // NOTE: `fetchAllPostsAction` is not defined in this file. Assuming it is imported elsewhere.
            const allPostsData = await fetchAllPostsAction(userId);
      
            if (allPostsData.success && allPostsData.data.length === 0) {
              timerId = setTimeout(() => {
                setShowFirstPostModal(true);
              }, 3000);
            }
          } catch (err) {
            toast.error(err.message || "Error fetching posts", "error");
          }
        };

        fetchPosts();

        return () => {
          if (timerId) clearTimeout(timerId);
        };
      },[]);



  // Initial fetch on session load
  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
      if (!initialFetchDone && !fetchInProgress.current) {
        console.log("🚀 Initial fetch triggered for:", session.user.email);
        fetchInitialData();
      }
    }
  }, [session?.user?.email, status, initialFetchDone, fetchInitialData]);

  // Show connect modal for unauthenticated users after a delay
  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        setIsConnectModalOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleListingData = (listing) => {
        router.push("/post-management");

    // const dataToSend = {
    //   locality: listing?.storefrontAddress?.locality || "",
    //   website: listing?.websiteUri || "",
    // };

    // localStorage.setItem("listingData", JSON.stringify(dataToSend));
    // localStorage.setItem("accountId", listing.accountId);

    // router.push(`/post-management/${listing.name}`);
  };

  // Handle View Insights
  const handleViewInsights = async (listing, customStartDate = null, customEndDate = null) => {
    const locationId = listing.name.split("/")[1];
    
    setShowInsightsModal(true);
    setInsightsLoading(true);
    setSearchKeywordsLoading(true);
    setInsightsData(null);
    setSearchKeywordsData(null);
    setSelectedListingTitle(listing.title || "Unknown Listing");
    setSelectedLocationId(locationId);

    const startDate = customStartDate || insightsStartDate;
    const endDate = customEndDate || insightsEndDate;

    try {
      const insights = await fetchLocationInsights(session.accessToken, locationId, startDate, endDate);
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

      const keywords = await fetchSearchKeywords(session.accessToken, locationId, startMonth, endMonth);
      setSearchKeywordsData(keywords);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights. Please try again.");
    } finally {
      setInsightsLoading(false);
      setSearchKeywordsLoading(false);
    }
  };

  // Handle date change in modal
  const handleDateChange = async (newStartDate, newEndDate) => {
    setInsightsStartDate(newStartDate);
    setInsightsEndDate(newEndDate);
    
    if (selectedLocationId) {
      setInsightsLoading(true);
      try {
        const insights = await fetchLocationInsights(
          session.accessToken, 
          selectedLocationId, 
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
    }
  };

  // Summary Update & Store location details
  useEffect(() => {
    if (accounts.length > 0) {
      const allListings = accounts.flatMap((acc) => acc.listings);
      
      
  const locationDetails = allListings.map(item => {
    const locationId = item.name.split("/")[1];
    const accountId = item.accountId || "";
    const locality = item.storefrontAddress?.locality || "";
    const address = item.storefrontAddress?.addressLines?.[0] || "";
    const title = item.title || "";
    const isVerified = item.hasVoiceOfMerchant === true;
    const websiteUrl = item.websiteUri || "";
    const reviewUri = item.metadata?.newReviewUri || "";

    return { locationId, accountId, locality, address, title, websiteUrl, reviewUri, isVerified };
  });

  if (allListings.length > 0) {
    localStorage.setItem("reviewUrl", allListings[0].metadata?.newReviewUri || "");
  }

  localStorage.setItem("locationDetails", JSON.stringify(locationDetails));

      const total = allListings.length;
      const verified = allListings.filter((l) => l.hasVoiceOfMerchant === true).length;
      const unverified = allListings.filter((l) => l.hasVoiceOfMerchant === false).length;
      const pending = 0;
      setSummary({ total, verified, unverified, pending });
    }
  }, [accounts]);

  // Add Project with proper cache clearing
  const handleAddProject = async () => {
    if (!session) {
      await signIn("google", { redirect: false });
      return;
    }

    if (accounts.length >= maxAccounts) {
      toast.error(`⚠️ ${userPlan} plan allows only ${maxAccounts} profiles. Upgrade to add more!`);
      return;
    }

    // Force refresh to get latest data
    await fetchInitialData(true);
  };

  // Manual refresh button handler
  const handleManualRefresh = async () => {
    if (!session?.accessToken) {
      toast.error("Please sign in first");
      return;
    }
    
    toast.success("Refreshing data...", { duration: 1000 });
    clearCache();
    await fetchInitialData(true);
  };

  // Verification Badge
  const getVerificationBadge = (listing) => {
    const isVerified = listing.hasVoiceOfMerchant === true;

    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 whitespace-nowrap">
          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
          <span className="hidden sm:inline">Verified</span>
          <span className="sm:hidden">✓</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200 whitespace-nowrap">
          <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
          <span className="hidden sm:inline">Unverified</span>
          <span className="sm:hidden">✗</span>
        </span>
      );
    }
  };

  // Filter Listings
  const getFilteredListings = (listings) => {
    if (filterStatus === "verified") {
      return listings.filter((l) => l.hasVoiceOfMerchant === true);
    } else if (filterStatus === "unverified") {
      return listings.filter((l) => l.hasVoiceOfMerchant === false);
    }
    return listings;
  };

  // Loading State
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="text-center flex flex-col items-center justify-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#3b82f6" }} />
          <p className="text-gray-700 font-semibold mt-6 text-base sm:text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

// Unauthenticated state
// Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <>
        <ConnectModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
        <div className="relative w-full flex flex-col items-center justify-center p-0 mx-auto bg-transparent">
          {/* ---------- TOP ICON NAV BAR (Optimized Paytm Style) ---------- */}
          <div className="w-full max-w-3xl bg-white/80 shadow-md px-6 py-6 rounded-2xl mb-8">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(95px,1fr))] gap-6 place-items-center">
              {navItems.map((item, i) => {
                // --- UNAUTHENTICATED CLICK LOGIC ---
                const handleClick = () => {
                  if (item.href === "/post-management") return router.push("/post-management");
                  if (item.href === "/wallet") return router.push("/wallet");
                  return signIn("google", { callbackUrl: item.href });
                };
                return (
                  <button key={i} onClick={handleClick} className="flex flex-col items-center text-[13px] text-gray-800">
                    <div className="p-4 rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
                      {item.icon}
                    </div>
                    <span className="mt-2 text-center leading-tight font-semibold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- MAIN CONTENT ---------- */}
          <div className="w-full max-w-2xl text-center pt-2 pb-12">
            <h1
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-snug cursor-pointer"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <span className="text-blue-600 cursor-pointer">Connect Your Business</span>
            </h1>

            <p className="text-gray-700 text-[17px] font-medium max-w-lg mx-auto mb-6 leading-relaxed">
              Connect your business platforms to automate management and boost your online presence.
            </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto px-4">

  {/* Google Business */}
  <button
    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    className="bg-white border border-blue-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group"
  >
    <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
      <Building2 className="w-6 h-6 text-blue-600" />
    </div>
    <span className="text-sm font-bold text-gray-800 leading-tight">
      Google Business
    </span>
    <span className="text-[10px] text-gray-500">Connect</span>
  </button>

  {/* Facebook */}
 {/* Facebook */}
{facebookPages.length === 0 ? (
  /* 👉 CONNECT FACEBOOK (DEFAULT) */
  <button
    onClick={() => (window.location.href = "/api/facebook/login")}
    className="bg-white border border-blue-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group"
  >
    <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
      <Facebook className="w-6 h-6 text-[#1877F2]" />
    </div>
    <span className="text-sm font-bold text-gray-800 leading-tight">
      Facebook Page
    </span>
    <span className="text-[10px] text-gray-500">Connect</span>
  </button>
) : (
  /* 👉 FACEBOOK CONNECTED → SHOW PAGENAME IN SAME SLOT */
  <div className="relative bg-white border border-blue-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
    
    {/* Logout Icon */}
    <button
        onClick={() => {
            setFacebookPages([]);
            toast.success("Disconnected Facebook Page");
        }}
        className="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        title="Disconnect"
    >
        <LogOut className="w-3.5 h-3.5" />
    </button>

    <div className="bg-blue-50 p-2 rounded-full">
      <Facebook className="w-6 h-6 text-[#1877F2]" />
    </div>

    <span className="text-sm font-bold text-gray-900 text-center truncate w-full px-1">
      {facebookPages[0].pageName}
    </span>

    <div className="flex gap-2 w-full mt-1">
        <button
  onClick={() =>
    router.push(
      `/post-management?pageId=${facebookPages[0].pageId}`
    )
  }
  className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition"
>
  Manage
</button>

        <button
        onClick={() => (window.location.href = "/api/facebook/login")}
        className="flex-1 text-[10px] bg-gray-50 text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition font-medium whitespace-nowrap"
        >
        Add Page
        </button>
    </div>
  </div>
)}


  {/* Instagram */}
  <button
    onClick={() => (window.location.href = "/api/meta/login")}
    className="bg-white border border-pink-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all flex flex-col items-center gap-2 group"
  >
    <div className="bg-pink-50 p-2 rounded-full group-hover:bg-pink-100 transition-colors">
      <Instagram className="w-6 h-6 text-[#E4405F]" />
    </div>
    <span className="text-sm font-bold text-gray-800 leading-tight">
      Instagram Biz
    </span>
    <span className="text-[10px] text-gray-500">Connect</span>
  </button>

  {/* WhatsApp */}
  <button
    onClick={() => toast("WhatsApp integration coming soon!")}
    className="bg-white border border-green-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all flex flex-col items-center gap-2 group"
  >
    <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-100 transition-colors">
      <MessageCircle className="w-6 h-6 text-[#25D366]" />
    </div>
    <span className="text-sm font-bold text-gray-800 leading-tight">
      WhatsApp Biz
    </span>
    <span className="text-[10px] text-gray-500">Coming Soon</span>
  </button>

</div>

          </div>
        </div>
      </>
    );
  }


  console.log("facebookPagesfacebookPagesfacebookPages",facebookPages);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insightsData}
        listingTitle={selectedListingTitle}
        loading={insightsLoading}
        startDate={insightsStartDate}
        endDate={insightsEndDate}
        onDateChange={handleDateChange}
        searchKeywords={searchKeywordsData}
        searchKeywordsLoading={searchKeywordsLoading}
      />
      <Toaster position="top-right" />


       {showFirstPostModal && (
          <FirstPostModal
            onClose={() => setShowFirstPostModal(false)}
            onCreate={() => router.push("/post-management")}
          />
        )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Top Navigation Icons */}
          <div className="mb-4">
            <NavLinks isAuthenticated={true} />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            {/* Left side: Title and Welcome Message */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                AI GMB Auto Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm truncate">Welcome back, {session?.user?.name || "User"} 👋</p>
              {cacheStatus && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {cacheStatus}
                </p>
              )}
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end sm:justify-start flex-wrap self-start sm:self-center">
              {/* Refresh Button */}
              {accounts.length > 0 && (
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl shadow-md hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Refresh data from Google"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}

              {session && (
                <button
                  onClick={() => signOut({ callbackUrl: "/dashboard" })}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold px-3 sm:px-5 py-2 rounded-lg sm:rounded-xl shadow-md hover:from-red-700 hover:to-pink-700 transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
                >
                  Logout
                </button>
              )}

              {accounts.length < maxAccounts && (
                <button
                  onClick={handleAddProject}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base whitespace-nowrap"
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Add Project</span>
                      <span className="xs:hidden">Add</span>
                      <span className="text-xs bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        {accounts.length}/{maxAccounts}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-6">

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <CircularProgress size={60} thickness={4} sx={{ color: "#3b82f6" }} />
              <p className="text-gray-700 font-semibold mt-6">Loading your listings...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching data from Google Business Profile</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {accounts.length > 0 && !loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div 
              onClick={() => setFilterStatus("all")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-blue-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "all" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Total Listings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.total}</p>
                </div>
                <Building2 className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("verified")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-green-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "verified" ? "ring-2 ring-green-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Verified</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.verified}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-10 sm:h-10 text-green-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("unverified")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "unverified" ? "ring-2 ring-red-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Unverified</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.unverified}</p>
                </div>
                <XCircle className="w-6 h-6 sm:w-10 sm:h-10 text-red-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-yellow-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.pending}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-500 opacity-80 hidden sm:block" />
              </div>
            </div>
          </div>
        )}

        {/* Facebook Pages Section */}
        {/* {facebookPages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Connected Facebook Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facebookPages.map((page) => (
                <div
                  key={page.pageId}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded-full">
                      <Facebook className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <p className="font-semibold text-lg text-gray-900 truncate">{page.pageName}</p>
                  </div>
                  <button
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    onClick={() => toast.success(`Selected ${page.pageName}`)}
                  >
                    Manage Page
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* No Accounts Found Message */}
        {noAccountsFound && initialFetchDone && accounts.length === 0 && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center mb-6">
            <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Account Found</h3>
            <p className="text-gray-700 mb-4 max-w-md mx-auto text-sm sm:text-base">
              No Google Business Profile found associated with <strong>{session?.user?.email}</strong>
            </p>
            <p className="text-gray-600 mb-6 text-sm">
              Please try logging in with a different Google account that has a Business Profile.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/dashboard" })}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg"
            >
              Switch Account
            </button>
          </div>
        )}

        {/* Connected Platforms Section */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"> */}
          {/* <MetaConnectCard /> */}
          {/* Add more integration cards here in future */}
        {/* </div> */}

        {/* Listings or Empty State */}
        {accounts.length === 0 && !loading && !noAccountsFound && initialFetchDone && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No Listings Found</h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              No Google Business Profiles found. Add your project from Google Business Profile Manager.
            </p>
            <button
              onClick={handleAddProject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm sm:text-base"
            >
              Connect Your Business
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {accounts.length > 0 && !loading && (
          accounts.map((acc, idx) => {
            const filteredListings = getFilteredListings(acc.listings);
            
            return (
              <div key={idx} className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl sm:rounded-t-2xl px-4 sm:px-6 py-3 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-lg">
                  <h2 className="text-base sm:text-xl font-bold truncate">{acc.email}</h2>
                  <span className="text-xs sm:text-sm bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold backdrop-blur-sm whitespace-nowrap self-start sm:self-auto">
                    {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
                    {filterStatus !== "all" && ` (${filterStatus})`}
                  </span>
                </div>

                {filteredListings.length === 0 ? (
                  <div className="bg-white rounded-b-xl sm:rounded-b-2xl shadow-lg p-8 sm:p-12 text-center">
                    <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">No {filterStatus} listings found</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Try selecting a different filter above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
                    {filteredListings.map((listing, i) => (
                      <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200">
                        <div className="p-4 sm:p-6">
                          <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                                {listing.title || listing.name || "Unnamed Listing"}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2 truncate">
                                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{listing.categories?.primaryCategory?.displayName || "Uncategorized"}</span>
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {getVerificationBadge(listing)}
                            </div>
                          </div>

                          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-2.5 sm:p-3 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-700">Phone</span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">{listing.phoneNumbers?.primaryPhone || "N/A"}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-2.5 sm:p-3 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-700">Website</span>
                              </div>
                              <Link
                                href={listing.websiteUri || "#"}
                                className="text-xs sm:text-sm text-gray-900 font-medium truncate block hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {listing.websiteUri || "N/A"}
                              </Link>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-2.5 sm:p-3 rounded-lg border border-green-200">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-700">Address</span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-900 font-medium line-clamp-2">
                                {listing.storefrontAddress?.addressLines?.join(", ") || "N/A"}
                                {listing.storefrontAddress?.locality && `, ${listing.storefrontAddress.locality}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                              onClick={() => handleListingData(listing)}
                              className="flex-1 min-w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Manage Listing
                            </button>

                            <button
                              onClick={() => handleViewInsights(listing)}
                              className="flex-1 min-w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg sm:rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              View Insights
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </main>
    </div>
  
  );
}
