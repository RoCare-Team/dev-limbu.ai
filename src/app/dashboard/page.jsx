

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
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
  LogOut,
  Facebook,
  Instagram,
  MessageCircle,
  Send,
  FolderKey,
  SquareChartGantt,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// import FirstPostModal from "../../components/FirstPostModal";

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
import SocialConnectCard from "../../components/SocialConnectCard";
import SupportModal from "../../components/SupportModal";
import FirstPostModal from "@/components/FirstPostModal";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";

// --- API Helpers ---
export async function fetchGMBAccounts(accessToken) {
  try {
    const res = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch accounts: ${res.status} ${errText}`);
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

      if (!res.ok) throw new Error(`Failed to fetch locations for account ${accountId}: ${res.status}`);

      const data = await res.json();
      console.log("pagesLocations",data);
      
      
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

export async function fetchLocationLogo(accessToken, locationName) {
  try {
    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      console.log("Media fetch failed:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    // console.log(`[DEBUG] Media items for ${locationName}:`, data);

    if (data.mediaItems && data.mediaItems.length > 0) {
       const item = data.mediaItems.find(i => i.locationAssociation?.category === 'LOGO') 
                 || data.mediaItems.find(i => i.locationAssociation?.category === 'PROFILE')
                 || data.mediaItems[0];
       
      //  console.log(`[DEBUG] Selected media item for ${locationName}:`, item);
       return item?.thumbnailUrl || item?.googleUrl || null;
    }
    return null;
  } catch (err) {
    return null;
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
      }),
    });

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error storing listings for admin:', error);
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
        bg-gradient-to-r from-yellow-500 to-purple-600 text-white 
        px-4 sm:px-6 py-4 
        flex justify-between items-center 
        rounded-t-2xl 
        flex-shrink-0
      ">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Performance Insightss</h2>
          <p className="text-xs sm:text-sm text-blue-100">{listingTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-lightPrimary mb-6">
          <Rocket className="h-8 w-8 text-dark" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-3">
            Connect Your Business
            <span className="block text-lg sm:text-xl text-lightPrimary font-medium mt-1">— Hassle-Free & Instantly</span>
          </h2>
          <p className="text-gray-600 mb-8 text-sm sm:text-base max-w-sm mx-auto">
            Securely link your Google Business Profile with a single click to unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-lightPrimary text-dark font-semibold px-8 py-4 rounded-xl hover:opacity-95 transition-opacity text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" fill="currentColor"><path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" /></svg>
            Connect Now with Bussiness
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Session Expired Modal ---
function SessionExpiredModal({ isOpen, onLogin }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative animate-scaleUp">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <LogOut className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
        <p className="text-gray-600 mb-6">Please sign in again to continue managing your business.</p>
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg"
        >
          Sign In Again
        </button>
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
  const [instagramPages, setInstagramPages] = useState([]);
  const [cacheStatus, setCacheStatus] = useState(""); // For showing cache info
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);  
  const [showFirstPostModal, setShowFirstPostModal] = useState(false);
  const [FbPageData,setFbPageData] = useState([])
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [listings, setListings] = useState([]);


  const userId = localStorage.getItem("userId");

  
  const [insightsStartDate, setInsightsStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [insightsEndDate, setInsightsEndDate] = useState(new Date());

  // Performance Insights Modal States
  const [showPerformanceInsightsModal, setShowPerformanceInsightsModal] = useState(false);
  const [performanceInsightsData, setPerformanceInsightsData] = useState(null);
  const [performanceInsightsLoading, setPerformanceInsightsLoading] = useState(false);
  const [selectedPerformanceLocation, setSelectedPerformanceLocation] = useState(null);
  const [performanceInsightsDateRange, setPerformanceInsightsDateRange] = useState(() => ({
    startDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })(),
    endDate: new Date(),
  }));
  const [performanceSearchKeywords, setPerformanceSearchKeywords] = useState(null);

  // Location Selector for GMB Insights
  const [showLocationSelectorModal, setShowLocationSelectorModal] = useState(false);

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

const navItems = [
  
  {
    href: "/gmb-insights",
    icon: <SquareChartGantt className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "GMB Insights",
    isFree: true,
  },
   {
    href: "/gmb-health",
    icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "GMB Health",
    isFree: true,
  },
    {
    href: "/get-magic-qr",
    icon: <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Magic QR",
    isFree: true,
  },

    {
    href: "/review-management",
    icon: <Star className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Review Reply",
    isFree: true,
  },


   
  {
    href: "/keyword-planner",
    icon: <FolderKey className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: "Keyword Planner",
    isFree: true,
  },
  {
   href: "/build-website",
   icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />,
   label: "Website Builder",
   isFree: true,
  //  specialTag: "Launched Today",
 },
  {
    href: "/post-management",
    icon: <PlusSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
    label: (
  <>
    Create & Publish <br />
    Post
  </>
),
  },
  
];




const NavLinks = ({ isAuthenticated, onGmbInsightsClick }) => {
  return (
    <div className="w-full  px-4 py-3 ">
     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 place-items-center ">
        {navItems.map((item) => {
          const isPublic =
            item.href === "/post-management" || item.href === "/wallet";

          const isEnabled = isAuthenticated || isPublic;
          const isKeywordPlanner = item.label === "Keyword Planner";
          const isGmbInsights = item.label === "GMB Insights";

          const FeatureIcon = (
            <div
              className="flex flex-col items-center min-w-[90px] cursor-pointer transition"
              onClick={
                !isEnabled
                  ? () => signIn("google", { callbackUrl: item.href })
                  : isGmbInsights
                  ? onGmbInsightsClick
                  : undefined
              }
            >
              {/* ICON WRAPPER */}
              <div className="relative ">

                {/* FREE Badge */}
                {item.isFree && (
                  <span className="absolute -top-2 -right-8 bg-dark text-lightPrimary text-[8px] font-bold px-2 py-[2px] rounded-full shadow-md z-20">
                    FREE
                  </span>
                )}

                {/* Yellow Icon Box */}
                <div
                  className={`p-5 rounded-xl transition 
                    ${
                      pathname === item.href && isAuthenticated
                        ? "bg-dark text-white"
                        : "bg-lightPrimary text-dark"
                    }
                  `}
                >
                  {React.cloneElement(item.icon, {
                    className: "h-5 w-5",
                  })}
                </div>

                {/* Verified by Google */}
                {isKeywordPlanner && (
                  <span
                    className="
                      absolute
                      -bottom-5
                      left-1/2 -translate-x-1/2
                      flex items-center gap-1
                      bg-white border border-neutral-400
                      px-2 py-[2px]
                      rounded-full
                      shadow-sm
                      text-[7px]
                      text-gray-600
                      whitespace-nowrap
                    "
                  >
                    <span>Verified by</span>
                    <img
                      src="https://1000logos.net/wp-content/uploads/2021/05/Google-logo.png"
                      alt="Google"
                      className="h-2.5 w-auto"
                    />
                  </span>
                )}
              </div>

              {/* LABEL */}
              <span className="mt-4 sm:mt-6 text-[10px] sm:text-xs font-semibold text-gray-800 text-center leading-tight h-[32px] flex items-start justify-center">
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
      if (status === "authenticated") {
        // If next-auth thinks we are authenticated but we have no token, session is invalid
        setIsSessionExpired(true);
      }
      return;
    }
    
    const userEmail = session.user.email;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const { loaded, needsRefresh } = loadFromCache(userEmail);
      if (loaded) {
        if (needsRefresh) {
          // toast.info("Cache data is old. Refreshing in background...", { duration: 2000 });
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
                const logoUrl = await fetchLocationLogo(token, `accounts/${accountId}/${loc.name}`);
                return {
                  ...loc,
                  accountId,
                  accountName: accountName || account.name,
                  hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
                  hasBusinessAuthority: vomStatus.hasBusinessAuthority,
                  logoUrl,
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
        console.log("📤 Storing listings for admin dashboard...",allListings);
        await storeUserListingsForAdmin(userEmail, allListings);
        
        setCacheStatus(`${allListings.length} listings loaded and cached`);
      } else {
        console.log("❌ No locations found in any account");
        setAccounts([]);
        setNoAccountsFound(false);
        saveToCache(userEmail, [], false);
        setNoAccountsFound(true);
        saveToCache(userEmail, [], true);
        setCacheStatus("No listings found");
      }
      
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      if (error.message.includes("401") || error.message.includes("UNAUTHENTICATED") || error.message.includes("403")) {
        setIsSessionExpired(true);
        toast.error("Session expired. Please sign in again.");
      }
      toast.error("Failed to load listings. Please try again.");
      if (!isBackground) setNoAccountsFound(true);
      setCacheStatus("Error fetching data");
    }

    setInitialFetchDone(true);
    if (!isBackground) setLoading(false);
    fetchInProgress.current = false;
  }, [session?.accessToken, session?.user?.email, status, loadFromCache, saveToCache]);

  // --- Fetch Facebook Pages ---
  const fetchFacebookPages = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const res = await fetch(`/api/facebook/pages?userId=${userId}`);
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

  // --- Fetch Instagram Pages ---
const fetchInstagramPages = useCallback(async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const res = await fetch(`/api/instagram/pages?userId=${userId}`);
    const data = await res.json();

    if (data.success) {
      setInstagramPages(data.pages);
    }
  } catch (error) {
    console.error("Error fetching Instagram pages:", error);
  }
}, []);


  useEffect(() => {
    fetchInstagramPages();
    if (searchParams?.get("ig") === "connected") {
      toast.success("Instagram Account connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchInstagramPages, searchParams, router]);

  // --- Disconnect Handlers ---
  const handleDisconnectFacebook = async (pageId) => {
    if (!confirm("Are you sure you want to disconnect this page?")) return;
    setFacebookPages((prev) => prev.filter((p) => p.pageId !== pageId));
    toast.success("Facebook page disconnected");
    try {
      const userId = localStorage.getItem("userId");
      await fetch(`/api/facebook/disconnect?userId=${userId}&pageId=${pageId}`, { method: "POST" });
    } catch (error) {
      console.error("Error disconnecting Facebook page:", error);
    }
  };

  const handleDisconnectInstagram = async (igId) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    setInstagramPages((prev) => prev.filter((p) => p.igId !== igId));
    toast.success("Instagram account disconnected");
    try {
      const userId = localStorage.getItem("userId");
      await fetch(`/api/instagram/disconnect?userId=${userId}&igId=${igId}`, { method: "POST" });
    } catch (error) {
      console.error("Error disconnecting Instagram account:", error);
    }
  };

  // --- Real Logout Handler (Revoke All) ---
  const handleMetaLogout = async () => {
    if (!confirm("Are you sure you want to fully logout from Facebook and Instagram? This will revoke all tokens and disconnect all accounts.")) return;
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Login first");
    try {
      const res = await fetch("/api/meta-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facebook: true, instagram: true })
      });
      const data = await res.json();
      if (data.success) {
        setFacebookPages([]);
        setInstagramPages([]);
        toast.success("Successfully logged out from Facebook & Instagram");
      } else {
        toast.error("Logout failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Logout failed");
    }
  };


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

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

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

  // Handle View Performance Insights
  const handleViewPerformanceInsights = async (listing, customStartDate = null, customEndDate = null) => {
    const locationId = listing.name.split("/")[1];
    
    setShowPerformanceInsightsModal(true);
    setPerformanceInsightsLoading(true);
    setPerformanceInsightsData(null);
    setSelectedPerformanceLocation({
      name: listing.title || "Unknown Listing",
      id: locationId,
      businessProfileId: listing.name,
      city: listing.storefrontAddress?.locality || "",
      locality: listing.storefrontAddress?.administrativeArea || "",
    });

    const startDate = customStartDate || performanceInsightsDateRange.startDate;
    const endDate = customEndDate || performanceInsightsDateRange.endDate;
    const reportStart = startDate instanceof Date ? startDate : new Date(startDate);
    const reportEnd = endDate instanceof Date ? endDate : new Date(endDate);
    const { fetchStart, reportEnd: insightSeriesEnd } = getPerformanceInsightsWindows(reportStart, reportEnd);

    try {
      const insights = await fetchLocationInsights(session.accessToken, locationId, fetchStart, insightSeriesEnd);
      setPerformanceInsightsData(insights);

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
      // Extract the array from the Google API response (remove searchKeywordsCounts wrapper)
      const keywordsArray = keywords?.searchKeywordsCounts || keywords || null;
      setPerformanceSearchKeywords(keywordsArray);
    } catch (error) {
      console.error("Error fetching performance insights:", error);
      toast.error("Failed to load performance insights. Please try again.");
    } finally {
      setPerformanceInsightsLoading(false);
    }
  };

  // Handle GMB Insights nav item click - show location selector then open modal
  const handleGmbInsightsClick = () => {
    // Get all locations from accounts
    const allListings = accounts.length > 0 ? accounts.flatMap((acc) => acc.listings) : [];
    
    if (allListings.length === 0) {
      toast.error("No locations found. Please connect your Google Business Profile first.");
      return;
    }
    
    if (allListings.length === 1) {
      // Only one location - directly open insights
      handleViewPerformanceInsights(allListings[0]);
    } else {
      // Multiple locations - show location selector
      setShowLocationSelectorModal(true);
    }
  };

  // Handle location selection from selector modal
  const handleLocationSelect = (listing) => {
    setShowLocationSelectorModal(false);
    handleViewPerformanceInsights(listing);
  };

  const handlePerformanceInsightsDateChange = (dateRange) => {
    setPerformanceInsightsDateRange(dateRange);
    // Refetch insights with new date range
    if (selectedPerformanceLocation) {
      const listing = {
        name: selectedPerformanceLocation.businessProfileId,
        title: selectedPerformanceLocation.name,
      };
      handleViewPerformanceInsights(listing, dateRange.startDate, dateRange.endDate);
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
    if (listings.length > 0) {
      const total = listings.length;
      const verified = listings.filter((l) => l.hasVoiceOfMerchant === true).length;
      const unverified = listings.filter((l) => l.hasVoiceOfMerchant === false).length;
      const pending = 0;
      setSummary({ total, verified, unverified, pending });

      const locationDetails = listings.map(item => {
        const locationId = item.name.split("/")[1];
        const accountId = item.accountId || "";
        const locality = item.storefrontAddress?.locality || "";
        const address = item.storefrontAddress?.addressLines?.[0] || "";
        const title = item.title || "";
        const isVerified = item.hasVoiceOfMerchant === true;
        const websiteUrl = item.websiteUri || "";
        const reviewUri = item.metadata?.newReviewUri || "";
        const businessProfileId = item.name || "";

        return {
          locationId,
          accountId,
          locality,
          address,
          title,
          websiteUrl,
          reviewUri,
          isVerified,
          businessProfileId,
          name: item.name,
          websiteUri: item.websiteUri,
          storefrontAddress: item.storefrontAddress,
          phoneNumbers: item.phoneNumbers,
          categories: item.categories,
          openInfo: item.openInfo,
          metadata: item.metadata,
        };
      });
      localStorage.setItem("locationDetails", JSON.stringify(locationDetails));
      if (listings.length > 0) {
        localStorage.setItem("reviewUrl", listings[0].metadata?.newReviewUri || "");
      }
      return;
    }
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
    const businessProfileId = item.name || "";

    return {
      locationId,
      accountId,
      locality,
      address,
      title,
      websiteUrl,
      reviewUri,
      isVerified,
      businessProfileId,
      name: item.name,
      websiteUri: item.websiteUri,
      storefrontAddress: item.storefrontAddress,
      phoneNumbers: item.phoneNumbers,
      categories: item.categories,
      openInfo: item.openInfo,
      metadata: item.metadata,
    };
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
  }, [accounts, listings]);

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

  useEffect(() => {
    const fetchListings = async () => {

      const token =
        localStorage.getItem("isImpersonating") === "true"
          ? localStorage.getItem("userToken")
          : localStorage.getItem("adminToken");

      if (!token) return;

      const res = await fetch("/api/admin/saveBussiness", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setListings(data.listings || []);
    };

    fetchListings();
  }, []);

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






  console.log("listingslistings",listings);
  

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 md:overflow-hidden">
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

      <PerformanceInsightsModal
        isOpen={showPerformanceInsightsModal}
        onClose={() => setShowPerformanceInsightsModal(false)}
        insightsData={performanceInsightsData}
        businessName={selectedPerformanceLocation?.name || ""}
        locationName={selectedPerformanceLocation?.name || ""}
        city={selectedPerformanceLocation?.city || ""}
        locality={selectedPerformanceLocation?.locality || ""}
        locationId={selectedPerformanceLocation?.id || ""}
        businessProfileId={selectedPerformanceLocation?.businessProfileId || ""}
        dateRange={performanceInsightsDateRange}
        searchKeywords={performanceSearchKeywords}
        loading={performanceInsightsLoading}
        onDateChange={handlePerformanceInsightsDateChange}
      />
      
      <SessionExpiredModal 
        isOpen={isSessionExpired} 
        onLogin={() => signIn("google", { callbackUrl: "/dashboard" })} 
      />
      
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
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

          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-3 sm:gap-4">
            {/* Left side: Social Icons & Welcome */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <p className="text-dark text-sm truncate font-medium">
                Welcome, <span className="text-gray-900 font-bold">{session?.user?.name || "User"}</span> 👋
              </p>
            </div>

            {/* Right side: Action Buttons */}
            <div className="hidden lg:flex items-center gap-2 sm:gap-4 justify-end sm:justify-start flex-wrap self-start sm:self-center">
              {/* Refresh Button */}
              {accounts.length > 0 && (
                <>
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="bg-lightPrimary text-dark font-semibold px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl shadow-md hover:bg-yellow-400 transition-all duration-300 text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Refresh data from Google"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ">Refresh </span>
                  </button>
                  {/* <button
                    onClick={handleMetaLogout}
                    className="bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl shadow-md hover:from-red-600 hover:to-blue-700 transition-all duration-300 text-sm sm:text-base whitespace-nowrap flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout FB/IG</span>
                  </button> */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/dashboard" })}
                    className=" font-semibold px-3 sm:px-4 py-2 rounded-lg bg-lightPrimary text-dark sm:rounded-xl shadow-md hover:bg-yellow-400 transition-all duration-300 text-sm sm:text-base whitespace-nowrap flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-0">

        {/* --- Google Business Column --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-dark" />
                <h2 className="font-bold text-dark">Google Business </h2>
              </div>
              <div className="flex items-center gap-2">
<span className="text-xs bg-dark text-lightPrimary font-semibold px-2 py-0.5 rounded-full">Total: {summary.total}</span>
                {accounts.length > 0 && (
  <button
    onClick={() => signOut({ callbackUrl: "/dashboard" })}
    className="text-gray-400 hover:text-red-500 transition-colors p-1"
    title="Logout"
  >
    <LogOut className="w-4 h-4" />
  </button>
)}

<button
  onClick={handleAddProject}
  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
  title="Add Account"
>
  <Plus className="w-4 h-4" />
</button>

                
              </div>
            </div>
            
            {/* Summary / Filter Pills */}
            <div className="flex gap-2 text-xs">
              <button onClick={() => setFilterStatus('verified')} className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-colors ${filterStatus === 'verified' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Verified ({summary.verified})
              </button>
              <button onClick={() => setFilterStatus('unverified')} className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-colors ${filterStatus === 'unverified' ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Unverified ({summary.unverified})
              </button>
              {filterStatus !== 'all' && <button onClick={() => setFilterStatus('all')} className="px-2 py-1.5 text-gray-500 hover:text-gray-700"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center py-10 text-gray-500">
                <CircularProgress size={30} />
                <p className="mt-2 text-sm">Loading Listings...</p>
              </div>
            )}
            {!loading && listings.length > 0 ? (
              getFilteredListings(listings).map((listing, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 transition-all hover:shadow-md">
                {/* Header: Logo + Title + Badge */}
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500">
                          <Building2 className="w-5 h-5" />
                        </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm text-gray-900 truncate" title={listing.title}>{listing.title}</h3>
                        <div className="flex-shrink-0 scale-90 origin-top-right">
                          {getVerificationBadge(listing)}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{listing.categories?.primaryCategory?.displayName || "Business"}</p>
                  </div>
                </div>

                {/* Details: Phone, Website, Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{listing.phoneNumbers?.primaryPhone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Globe className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      {listing.websiteUri ? <a href={listing.websiteUri} target="_blank" rel="noopener noreferrer" className="truncate hover:text-blue-600 hover:underline">{listing.websiteUri}</a> : <span className="text-gray-400">No website</span>}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{listing.storefrontAddress?.addressLines?.join(", ") || "No address"}{listing.storefrontAddress?.locality && `, ${listing.storefrontAddress.locality}`}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => handleListingData(listing)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-dark hover:bg-blue-100 rounded-lg transition text-xs font-bold"><Star className="w-3.5 h-3.5" /> Manage </button>
                  <button onClick={() => handleViewPerformanceInsights(listing)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition text-xs font-bold"><BarChart3 className="w-3.5 h-3.5" /> Insights</button>
                </div>
              </div>
            ))
            ) : (
              !loading && accounts.length > 0 && getFilteredListings(accounts[0].listings).map((listing, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 transition-all hover:shadow-md">
                {/* Header: Logo + Title + Badge */}
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {listing.logoUrl ? (
                        <img src={listing.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500">
                          <Building2 className="w-5 h-5" />
                        </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm text-dark truncate" title={listing.title}>{listing.title}</h3>
                        <div className="flex-shrink-0 scale-90 origin-top-right">
                          {getVerificationBadge(listing)}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{listing.categories?.primaryCategory?.displayName || "Business"}</p>
                  </div>
                </div>

                {/* Details: Phone, Website, Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-dark">
                      <Phone className="w-3.5 h-3.5 text-dark flex-shrink-0" />
                      <span className="truncate">{listing.phoneNumbers?.primaryPhone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-dark">
                      <Globe className="w-3.5 h-3.5 text-lightPrimary flex-shrink-0" />
                      {listing.websiteUri ? <a href={listing.websiteUri} target="_blank" rel="noopener noreferrer" className="truncate hover:text-blue-600 hover:underline">{listing.websiteUri}</a> : <span className="text-gray-400">No website</span>}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-dark flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{listing.storefrontAddress?.addressLines?.join(", ") || "No address"}{listing.storefrontAddress?.locality && `, ${listing.storefrontAddress.locality}`}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => handleListingData(listing)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-dark text-lightPrimary hover:bg-gray-700 rounded-lg transition text-xs font-bold"><Star className="w-3.5 h-3.5" /> Manage</button>
                  <button onClick={() => handleViewPerformanceInsights(listing)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-200 text-dark hover:bg-yellow-300 rounded-lg transition text-xs font-bold"><BarChart3 className="w-3.5 h-3.5" /> Insights</button>
                </div>
              </div>
            ))
            )}
            {!loading && accounts.length === 0 && listings.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <div className="bg-blue-50 p-4 rounded-full mb-4 ring-4 ring-blue-50/50">
                    <Building2 className="w-8 h-8 text-dark" />
                  </div>
                  
                  {session?.user?.email ? (
                    <>
                      <h3 className="text-gray-900 font-bold text-base mb-1">No Listings Found</h3>
                      <p className="text-xs text-gray-500 max-w-[240px] mb-6 leading-relaxed">
                        We couldn't find any Google Business profiles linked to <strong>{session.user.email}</strong>.
                      </p>
                      
                      <div className="flex flex-col gap-2.5 w-full max-w-[200px]">
                        <button
                          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                          className="w-full bg-lightPrimary text-dark text-xs font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Switch Account
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-gray-900 font-bold text-base mb-1">Connect Your Business</h3>
                      <p className="text-xs text-gray-500 max-w-[240px] mb-6 leading-relaxed">
                        Connect your Google Business Profile to start managing your listings.
                      </p>
                      
                      <div className="flex flex-col gap-2.5 w-full max-w-[200px]">
                        <button
                          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
className="w-full bg-dark text-lightPrimary text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Connect Now
                        </button>
                      </div>
                    </>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* --- Facebook Column --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-dark" />
              <h2 className="font-bold text-dark">Facebook</h2>
            </div>
            {facebookPages.length > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">{facebookPages.length}</span>}
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {facebookPages.length > 0 ? (
              <>
                {facebookPages.map(page => (
                  <div key={page.pageId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-gray-800">{page.pageName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark font-bold">Connected</span>
                        <button onClick={() => handleDisconnectFacebook(page.pageId)} className="text-gray-400 hover:text-red-500 transition-colors" title="Disconnect"><LogOut className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">ID: {page.pageId}</p>
                    <div className="pt-2 border-t border-gray-100">
                      <button onClick={() => router.push(`/post-management`)} className="w-full text-xs bg-dark text-lightPrimary py-1.5 rounded-md hover:bg-[#525252] font-semibold">Manage Page</button>
                    </div>
                  </div>
                ))}
                {/* FB Logout Button */}
                {facebookPages.length > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to logout from Facebook? This will revoke all Facebook tokens and disconnect all pages.")) return;
                      const userId = localStorage.getItem("userId");
                      if (!userId) return toast.error("Login first");
                      try {
                        const res = await fetch("/api/meta-logout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId, facebook: true, instagram: false })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setFacebookPages([]);
                          toast.success("Successfully logged out from Facebook");
                        } else {
                          toast.error("Logout failed: " + (data.error || "Unknown error"));
                        }
                      } catch (err) {
                        toast.error("Logout failed");
                      }
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-dark text-lightPrimary py-2 rounded-lg font-semibold hover: bg-[#525252] transition-all text-xs"
                  >
                    <LogOut className="w-4 h-4" /> Logout Facebook
                  </button>
                )}
                <button 
                  onClick={() => {
                    const userId = localStorage.getItem("userId");
                    if (!userId) return toast.error("Login first");
                    window.location.href = `/api/facebook/login?userId=${userId}`;
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-lightPrimary text-lightPrimary py-2 rounded-lg font-semibold hover:border-dark hover:text-dark transition-all text-xs"
                >
                  <Plus className="w-4 h-4" /> Connect Another Page
                </button>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center justify-center h-full text-gray-500">
                <Facebook className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm font-medium mb-3">Connect Facebook Page</p>
                <button
  onClick={() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Login first");
    window.location.href = `/api/facebook/login?userId=${userId}`;
  }}
  className="w-full bg-dark text-primary py-2 rounded-lg font-semibold"
>
  Connect Facebook Page
</button>

              </div>
            )}
          </div>
        </div>

        {/* --- Instagram Column --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-dark" />
                  <h2 className="font-bold text-dark">Instagram</h2>
                </div>
                {instagramPages.length > 0 && <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">{instagramPages.length}</span>}
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {instagramPages.length > 0 ? (
                  <>
                    {instagramPages.map(page => (
                      <div key={page.igId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-sm text-gray-800">@{page.igUsername}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-bold">Connected</span>
                            <button onClick={() => handleDisconnectInstagram(page.igId)} className="text-gray-400 hover:text-red-500 transition-colors" title="Disconnect"><LogOut className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">ID: {page.igId}</p>
                        <div className="pt-2 border-t border-gray-100">
                          <button onClick={() => router.push(`/post-management?pageId=${page.igId}`)} className="w-full text-xs bg-dark text-white py-1.5 rounded-md hover:bg-dark font-semibold">Manage Account</button>
                        </div>
                      </div>
                    ))}
                    {/* IG Logout Button */}
                    {instagramPages.length > 0 && (
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to logout from Instagram? This will revoke all Instagram tokens and disconnect all accounts.")) return;
                          const userId = localStorage.getItem("userId");
                          if (!userId) return toast.error("Login first");
                          try {
                            const res = await fetch("/api/meta-logout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId, facebook: false, instagram: true })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setInstagramPages([]);
                              toast.success("Successfully logged out from Instagram");
                            } else {
                              toast.error("Logout failed: " + (data.error || "Unknown error"));
                            }
                          } catch (err) {
                            toast.error("Logout failed");
                          }
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-dark text-white py-2 rounded-lg font-semibold hover:bg-dark transition-all text-xs"
                      >
                        <LogOut className="w-4 h-4" /> Logout Instagram
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        const userId = localStorage.getItem("userId");
                        if (!userId) return toast.error("Login first");
                        window.location.href = `/api/instagram/login?userId=${userId}`;
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-lightPrimary text-lightPrimary py-2 rounded-lg font-semibold hover:border-dark hover:text-lightPrimary transition-all text-xs"
                    >
                      <Plus className="w-4 h-4" /> Connect Another Account
                    </button>
                  </>
                ) : (
                  <div className="text-center p-8 flex flex-col items-center justify-center h-full text-dark">
                    <Instagram className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-3">Connect Instagram Account</p>
                    <button
                      onClick={() => {
                        const userId = localStorage.getItem("userId");
                        if (!userId) return toast.error("Login first");
                        window.location.href = `/api/instagram/login?userId=${userId}`;
                      }}
                      className="w-full bg-lightPrimary text-dark py-2 rounded-lg font-semibold  transition-colors"
                    >
                      Connect Instagram
                    </button>
                  </div>
                )}
              </div>
            </div>

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

      </main>
      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  
  );
}
