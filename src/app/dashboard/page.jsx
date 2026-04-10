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
  Area,
} from "recharts";
import MetaConnectCard from "../../components/MetaConnectCard";
import SocialConnectCard from "../../components/SocialConnectCard";
import SupportModal from "../../components/SupportModal";
import FirstPostModal from "@/components/FirstPostModal";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";

// --- API Helpers ---
export async function fetchGMBAccounts(accessToken) {
  try {
    const res = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } },
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
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok)
        throw new Error(
          `Failed to fetch locations for account ${accountId}: ${res.status}`,
        );

      const data = await res.json();
      console.log("pagesLocations", data);

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
      { headers: { Authorization: `Bearer ${accessToken}` } },
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
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      console.log("Media fetch failed:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    // console.log(`[DEBUG] Media items for ${locationName}:`, data);

    if (data.mediaItems && data.mediaItems.length > 0) {
      const item =
        data.mediaItems.find(
          (i) => i.locationAssociation?.category === "LOGO",
        ) ||
        data.mediaItems.find(
          (i) => i.locationAssociation?.category === "PROFILE",
        ) ||
        data.mediaItems[0];

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
    const response = await fetch("/api/admin/saveBussiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail,
        listings,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error storing listings for admin:", error);
  }
}

// --- Fetch Insights API ---
export async function fetchLocationInsights(
  accessToken,
  locationId,
  startDate,
  endDate,
) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
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
export async function fetchSearchKeywords(
  accessToken,
  locationId,
  startMonth,
  endMonth,
) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startMonth.year}&monthlyRange.start_month.month=${startMonth.month}&monthlyRange.end_month.year=${endMonth.year}&monthlyRange.end_month.month=${endMonth.month}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
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
function InsightsModal({
  isOpen,
  onClose,
  insights,
  listingTitle,
  loading,
  startDate,
  endDate,
  onDateChange,
  searchKeywords,
  searchKeywordsLoading,
}) {
  if (!isOpen) return null;

  const calculateTotal = (metricData) => {
    if (
      !metricData ||
      !metricData.timeSeries ||
      !metricData.timeSeries.datedValues
    ) {
      return 0;
    }
    return metricData.timeSeries.datedValues.reduce((sum, item) => {
      const value =
        typeof item.value === "string"
          ? parseInt(item.value, 10)
          : item.value || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  const getMetricByType = (type) => {
    if (!insights || !insights.multiDailyMetricTimeSeries) return null;

    if (insights.multiDailyMetricTimeSeries[0]?.dailyMetricTimeSeries) {
      const series =
        insights.multiDailyMetricTimeSeries[0].dailyMetricTimeSeries.find(
          (m) => m.dailyMetric === type,
        );
      return series;
    } else {
      return insights.multiDailyMetricTimeSeries.find(
        (m) => m.dailyMetric === type,
      );
    }
  };

  const directionRequests = getMetricByType("BUSINESS_DIRECTION_REQUESTS");
  const callClicks = getMetricByType("CALL_CLICKS");
  const websiteClicks = getMetricByType("WEBSITE_CLICKS");
  const mapsImpressions = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const searchImpressions = getMetricByType(
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  );

  const totalDirections = calculateTotal(directionRequests);
  const totalCalls = calculateTotal(callClicks);
  const totalWebsiteClicks = calculateTotal(websiteClicks);
  const totalMapsImpressions = calculateTotal(mapsImpressions);
  const totalSearchImpressions = calculateTotal(searchImpressions);
  const totalImpressions = totalMapsImpressions + totalSearchImpressions;

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
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
    const directions =
      getMetricByType("BUSINESS_DIRECTION_REQUESTS")?.timeSeries?.datedValues ||
      [];
    const calls = getMetricByType("CALL_CLICKS")?.timeSeries?.datedValues || [];
    const website =
      getMetricByType("WEBSITE_CLICKS")?.timeSeries?.datedValues || [];
    const maps =
      getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS")?.timeSeries
        ?.datedValues || [];
    const search =
      getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH")?.timeSeries
        ?.datedValues || [];

    const dataMap = new Map();

    const addData = (series, key) => {
      if (!series) return;
      series.forEach((d) => {
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

    addData(directions, "Directions");
    addData(calls, "Calls");
    addData(website, "Website");
    addData(maps, "Maps");
    addData(search, "Search");

    return Array.from(dataMap.values()).sort((a, b) => a.date - b.date);
  }, [insights]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 animate-fadeIn mt-10 sm:mt-14">
      <div
        id="insights-modal-content"
        className="
  bg-white rounded-[2rem] shadow-2xl 
  w-full max-w-5xl 
  h-[90vh] sm:max-h-[92vh]
  flex flex-col 
  overflow-hidden
  border border-black/5
"
      >
        {/* HEADER */}
        <div
          className="
        bg-black text-white 
        px-4 sm:px-6 py-5 
        flex justify-between items-center 
        flex-shrink-0
      "
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Performance Insights
              </h2>
              <p className="text-xs sm:text-sm text-yellow-400 font-semibold">
                {listingTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="hover:bg-white/10 p-2 rounded-full transition-all duration-300"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          id="insights-scroll-container"
          className="p-4 sm:p-8 overflow-y-auto flex-1 custom-scroll min-h-0"
        >
          {/* DATE RANGE */}
          <div
            className="
            bg-slate-50 
            border border-black/5 rounded-2xl 
            p-4 sm:p-6 mb-8
          "
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <h3
                className="text-base sm:text-lg font-bold text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Select Date Range
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDate(startDate)}
                  onChange={(e) =>
                    onDateChange(new Date(e.target.value), endDate)
                  }
                  max={formatDate(endDate)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDate(endDate)}
                  onChange={(e) =>
                    onDateChange(startDate, new Date(e.target.value))
                  }
                  min={formatDate(startDate)}
                  max={formatDate(new Date())}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Showing data for {getDaysDifference()} days</span>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CircularProgress
                size={50}
                thickness={4}
                sx={{ color: "#eab308" }}
              />
              <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs">
                Analyzing data...
              </p>
            </div>
          ) : insights && insights.multiDailyMetricTimeSeries ? (
            <>
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
                {/* TOTAL IMPRESSIONS */}
                <div className="bg-white border border-black/5 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-400/10 p-3 rounded-xl">
                      <Eye className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-2xl font-black text-black">
                      {totalImpressions.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    Total Impressions
                  </h3>
                </div>

                {/* WEBSITE CLICKS */}
                <div className="bg-white border border-black/5 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-400/10 p-3 rounded-xl">
                      <MousePointer className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-2xl font-black text-black">
                      {totalWebsiteClicks.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    Website Clicks
                  </h3>
                </div>

                {/* CALL CLICKS */}
                <div className="bg-white border border-black/5 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-400/10 p-3 rounded-xl">
                      <Phone className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-2xl font-black text-black">
                      {totalCalls.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    Call Clicks
                  </h3>
                </div>

                {/* DIRECTIONS */}
                <div className="bg-white border border-black/5 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-400/10 p-3 rounded-xl">
                      <Navigation className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-2xl font-black text-black">
                      {totalDirections.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    Directions
                  </h3>
                </div>
              </div>

              {/* CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Visibility Chart */}
                <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                  <h3
                    className="text-sm font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <Eye className="w-4 h-4 text-yellow-500" />
                    Visibility Trends
                  </h3>
                  <div className="h-64 w-full px-2 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorMaps"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#eab308"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#eab308"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            paddingTop: "20px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Maps"
                          stroke="#eab308"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorMaps)"
                          name="Maps Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="Search"
                          stroke="#000000"
                          strokeWidth={3}
                          fill="transparent"
                          name="Search Views"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engagement Chart */}
                <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                  <h3
                    className="text-sm font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <MousePointer className="w-4 h-4 text-yellow-500" />
                    Engagement Trends
                  </h3>
                  <div className="h-64 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                            fontWeight: 600,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            paddingTop: "20px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Website"
                          stroke="#eab308"
                          strokeWidth={3}
                          dot={false}
                          name="Website"
                        />
                        <Line
                          type="monotone"
                          dataKey="Calls"
                          stroke="#000000"
                          strokeWidth={3}
                          dot={false}
                          name="Calls"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* KEYWORDS */}
              <div
                className="
              bg-slate-50 
              border border-black/5 rounded-3xl 
              p-4 sm:p-8 mb-8
            "
              >
                <h3
                  className="text-base sm:text-lg font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  Top Search Keywords
                </h3>

                {searchKeywordsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <CircularProgress
                      size={40}
                      thickness={4}
                      sx={{ color: "#eab308" }}
                    />
                  </div>
                ) : topKeywords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topKeywords.map((keyword, idx) => {
                      const value = keyword.insightsValue?.value || 0;
                      const maxValue =
                        topKeywords[0]?.insightsValue?.value || 1;
                      const percentage = (value / maxValue) * 100;

                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl p-5 border border-black/5 hover:border-yellow-400/30 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="bg-black text-yellow-400 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-black text-sm uppercase tracking-tight">
                                {keyword.searchKeyword}
                              </span>
                            </div>
                            <span className="text-lg font-black text-black">
                              {value.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-yellow-400 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No search data available
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3
                className="text-lg font-bold text-black mb-2 uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                No Insights Available
              </h3>
              <p className="text-slate-400 font-semibold">
                Unable to load performance data for this listing.
              </p>
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md m-4 p-8 sm:p-12 relative transform transition-all animate-scaleUp border border-black/5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-yellow-400/10 mb-8">
          <Rocket className="h-10 w-10 text-yellow-600" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2
            className="text-3xl font-bold text-black mb-4 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Connect Your <span className="text-yellow-500">Business</span>
          </h2>
          <p className="text-slate-500 mb-10 text-sm font-semibold leading-relaxed max-w-sm mx-auto">
            Securely link your Google Business Profile with a single click to
            unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="btn-lemon w-full py-5 rounded-2xl text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02]"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" />
            </svg>
            Connect Business
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
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-black/5">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50 mb-8">
          <LogOut className="h-10 w-10 text-red-500" />
        </div>
        <h2
          className="text-2xl font-bold text-black mb-4 uppercase tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Session <span className="text-red-500">Expired</span>
        </h2>
        <p className="text-slate-500 mb-10 text-sm font-semibold">
          Your session has ended. Please sign in again to continue managing your
          business assets.
        </p>
        <button
          onClick={onLogin}
          className="btn-lemon w-full py-4 rounded-xl text-xs uppercase tracking-widest"
        >
          Sign In Again ↗
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
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    pending: 0,
  });
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
  const [FbPageData, setFbPageData] = useState([]);
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
  const [showPerformanceInsightsModal, setShowPerformanceInsightsModal] =
    useState(false);
  const [performanceInsightsData, setPerformanceInsightsData] = useState(null);
  const [performanceInsightsLoading, setPerformanceInsightsLoading] =
    useState(false);
  const [selectedPerformanceLocation, setSelectedPerformanceLocation] =
    useState(null);
  const [performanceInsightsDateRange, setPerformanceInsightsDateRange] =
    useState(() => ({
      startDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
      })(),
      endDate: new Date(),
    }));
  const [performanceSearchKeywords, setPerformanceSearchKeywords] =
    useState(null);

  // Location Selector for GMB Insights
  const [showLocationSelectorModal, setShowLocationSelectorModal] =
    useState(false);

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
      <div className="w-full py-2 px-3  rounded-[1rem]  mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-5">
          {navItems.map((item) => {
            const isPublic =
              item.href === "/post-management" || item.href === "/wallet";

            const isEnabled = isAuthenticated || isPublic;
            const isKeywordPlanner = item.label === "Keyword Planner";
            const isGmbInsights = item.label === "GMB Insights";
            const isActive = pathname === item.href && isAuthenticated;

            const handleClick = () => {
              if (!isEnabled) {
                return signIn("google", { callbackUrl: item.href });
              }
              if (isGmbInsights) {
                return onGmbInsightsClick();
              }
            };

            const Card = (
              <div
                onClick={handleClick}
                className={`group relative flex flex-col items-center justify-center p-5 rounded-3xl transition-all duration-300 cursor-pointer border-2 
              
              ${
                isActive
                  ? "bg-slate-900 border-yellow-400 shadow-lg scale-105"
                  : "bg-white border-slate-100 hover:border-yellow-400 hover:shadow-lg hover:bg-slate-900 hover:scale-105"
              }
              `}
              >
                {/* FREE Badge */}
                {item.isFree && (
                  <span className="absolute top-3 right-3 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                    Free
                  </span>
                )}

                {/* ICON */}
                <div
                  className={`mb-3 p-3 rounded-2xl transition-colors
                ${
                  isActive
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-slate-50 text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600"
                }
              `}
                >
                  {React.cloneElement(item.icon, { size: 24 })}
                </div>

                {/* LABEL */}
                <span
                  className={`text-[11px] font-bold uppercase tracking-tight text-center leading-tight transition-colors duration-300
                ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 group-hover:text-white"
                }
              `}
                >
                  {item.label}
                </span>

                {/* Verified by Google */}
                {isKeywordPlanner && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-black/10 px-2 py-0.5 rounded-full shadow-sm text-[7px] text-slate-500 font-bold whitespace-nowrap uppercase tracking-tighter">
                    <span>Verified by</span>
                    <img
                      src="https://1000logos.net/wp-content/uploads/2021/05/Google-logo.png"
                      alt="Google"
                      className="h-2 w-auto grayscale opacity-70"
                    />
                  </span>
                )}
              </div>
            );

            if (isEnabled) {
              return (
                <Link key={item.label} href={item.href}>
                  {Card}
                </Link>
              );
            }

            return <div key={item.label}>{Card}</div>;
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
      timestamp: Date.now(),
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
  const fetchInitialData = useCallback(
    async (forceRefresh = false, isBackground = false) => {
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

        console.log(
          `🔄 Fetching locations for ${accountsData.length} accounts...`,
        );

        const listingsPromises = accountsData.map(async (account) => {
          const accountId = account.name.replace("accounts/", "");
          const accountName = account.accountName;

          try {
            const locations = await fetchAllLocationsByAccount(
              token,
              accountId,
            );

            if (locations && locations.length > 0) {
              const locationsWithVoM = await Promise.all(
                locations.map(async (loc) => {
                  const vomStatus = await checkVoiceOfMerchant(token, loc.name);
                  const logoUrl = await fetchLocationLogo(
                    token,
                    `accounts/${accountId}/${loc.name}`,
                  );
                  return {
                    ...loc,
                    accountId,
                    accountName: accountName || account.name,
                    hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
                    hasBusinessAuthority: vomStatus.hasBusinessAuthority,
                    logoUrl,
                  };
                }),
              );
              return locationsWithVoM;
            }
          } catch (err) {
            console.error(
              `Error fetching locations for account ${accountName} (${accountId}):`,
              err,
            );
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
          console.log(
            "📤 Storing listings for admin dashboard...",
            allListings,
          );
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
        if (
          error.message.includes("401") ||
          error.message.includes("UNAUTHENTICATED") ||
          error.message.includes("403")
        ) {
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
    },
    [
      session?.accessToken,
      session?.user?.email,
      status,
      loadFromCache,
      saveToCache,
    ],
  );

  // --- Fetch Facebook Pages ---
  const fetchFacebookPages = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const res = await fetch(`/api/facebook/pages?userId=${userId}`);
      const data = await res.json();
      console.log("datadata", data);

      if (data.success) {
        console.log("data", data);

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
      await fetch(
        `/api/facebook/disconnect?userId=${userId}&pageId=${pageId}`,
        { method: "POST" },
      );
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
      await fetch(`/api/instagram/disconnect?userId=${userId}&igId=${igId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error disconnecting Instagram account:", error);
    }
  };

  // --- Real Logout Handler (Revoke All) ---
  const handleMetaLogout = async () => {
    if (
      !confirm(
        "Are you sure you want to fully logout from Facebook and Instagram? This will revoke all tokens and disconnect all accounts.",
      )
    )
      return;
    const userId = localStorage.getItem("userId");
    if (!userId) return toast.error("Login first");
    try {
      const res = await fetch("/api/meta-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facebook: true, instagram: true }),
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
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
  }, []);

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
  const handleViewInsights = async (
    listing,
    customStartDate = null,
    customEndDate = null,
  ) => {
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
      const insights = await fetchLocationInsights(
        session.accessToken,
        locationId,
        startDate,
        endDate,
      );
      setInsightsData(insights);
      setInsightsLoading(false);

      const currentDate = new Date();
      const startMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() - 3,
      };

      if (startMonth.month <= 0) {
        startMonth.month += 12;
        startMonth.year -= 1;
      }

      const endMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      };

      const keywords = await fetchSearchKeywords(
        session.accessToken,
        locationId,
        startMonth,
        endMonth,
      );
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
  const handleViewPerformanceInsights = async (
    listing,
    customStartDate = null,
    customEndDate = null,
  ) => {
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
    const reportStart =
      startDate instanceof Date ? startDate : new Date(startDate);
    const reportEnd = endDate instanceof Date ? endDate : new Date(endDate);
    const { fetchStart, reportEnd: insightSeriesEnd } =
      getPerformanceInsightsWindows(reportStart, reportEnd);

    try {
      const insights = await fetchLocationInsights(
        session.accessToken,
        locationId,
        fetchStart,
        insightSeriesEnd,
      );
      setPerformanceInsightsData(insights);

      const currentDate = new Date();
      const startMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() - 3,
      };

      if (startMonth.month <= 0) {
        startMonth.month += 12;
        startMonth.year -= 1;
      }

      const endMonth = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      };

      const keywords = await fetchSearchKeywords(
        session.accessToken,
        locationId,
        startMonth,
        endMonth,
      );
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
    const allListings =
      accounts.length > 0 ? accounts.flatMap((acc) => acc.listings) : [];

    if (allListings.length === 0) {
      toast.error(
        "No locations found. Please connect your Google Business Profile first.",
      );
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
      handleViewPerformanceInsights(
        listing,
        dateRange.startDate,
        dateRange.endDate,
      );
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
          newEndDate,
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
      const verified = listings.filter(
        (l) => l.hasVoiceOfMerchant === true,
      ).length;
      const unverified = listings.filter(
        (l) => l.hasVoiceOfMerchant === false,
      ).length;
      const pending = 0;
      setSummary({ total, verified, unverified, pending });

      const locationDetails = listings.map((item) => {
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
        localStorage.setItem(
          "reviewUrl",
          listings[0].metadata?.newReviewUri || "",
        );
      }
      return;
    }
    if (accounts.length > 0) {
      const allListings = accounts.flatMap((acc) => acc.listings);

      const locationDetails = allListings.map((item) => {
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
        localStorage.setItem(
          "reviewUrl",
          allListings[0].metadata?.newReviewUri || "",
        );
      }

      localStorage.setItem("locationDetails", JSON.stringify(locationDetails));

      const total = allListings.length;
      const verified = allListings.filter(
        (l) => l.hasVoiceOfMerchant === true,
      ).length;
      const unverified = allListings.filter(
        (l) => l.hasVoiceOfMerchant === false,
      ).length;
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
      toast.error(
        `⚠️ ${userPlan} plan allows only ${maxAccounts} profiles. Upgrade to add more!`,
      );
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
      <div className="flex items-center justify-center min-h-screen bg-white px-4">
        <div className="text-center flex flex-col items-center justify-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#eab308" }} />
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-8 text-sm">
            Initializing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
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

      {showLocationSelectorModal && (
        <LocationSelectionModal
          isOpen={showLocationSelectorModal}
          onClose={() => setShowLocationSelectorModal(false)}
          locations={
            accounts.length > 0 ? accounts.flatMap((acc) => acc.listings) : []
          }
          onSelect={handleLocationSelect}
        />
      )}

      <Toaster position="top-right" />

      {showFirstPostModal && (
        <FirstPostModal
          onClose={() => setShowFirstPostModal(false)}
          onCreate={() => router.push("/post-management")}
        />
      )}

      {/* Header */}
      <div className=" border-b border-black/5">
        <div className="w-full ">
          {/* Top Navigation Icons */}
          <NavLinks isAuthenticated={true} />

          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mt-6">
            {/* Left side: Welcome */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-yellow-500" />
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-yellow-700">
                  Live Dashboard
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Welcome,{" "}
                <span className="text-yellow-500">
                  {session?.user?.name?.split(" ")[0] || "User"}
                </span>{" "}
                👋
              </h1>
            </div>

            {/* Right side: Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {accounts.length > 0 && (
                <>
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="btn-ghost btn-md gap-2"
                    title="Refresh data from Google"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    <span>Refresh Data</span>
                  </button>

                  <button
                    onClick={() => signOut({ callbackUrl: "/dashboard" })}
                    className="btn-lemon btn-md gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-0 bg-slate-50/30"
        style={{ height: "calc(100vh - 220px)" }}
      >
        {/* --- Google Business Column --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col h-full overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
          {/* Header */}
          <div className="p-6 border-b border-black/5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <Building2 className="w-5 h-5 text-yellow-400" />
                </div>
                <h2
                  className="font-black text-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  GMB Profile
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-black text-yellow-400 font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {summary.total} Lists
                </span>
                <button
                  onClick={handleAddProject}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-black hover:scale-110 transition-transform"
                  title="Add Account"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary / Filter Pills */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("verified")}
                className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${filterStatus === "verified" ? "bg-black border-black text-yellow-400" : "bg-white border-black/5 text-slate-400 hover:border-yellow-400"}`}
              >
                Verified ({summary.verified})
              </button>
              <button
                onClick={() => setFilterStatus("unverified")}
                className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${filterStatus === "unverified" ? "bg-black border-black text-yellow-400" : "bg-white border-black/5 text-slate-400 hover:border-yellow-400"}`}
              >
                Issues ({summary.unverified})
              </button>
              {filterStatus !== "all" && (
                <button
                  onClick={() => setFilterStatus("all")}
                  className="w-10 flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            className="overflow-y-auto p-6 space-y-4 custom-scroll"
            style={{ height: "calc(100vh - 380px)" }}
          >
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <CircularProgress size={30} sx={{ color: "#eab308" }} />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Syncing...
                </p>
              </div>
            )}
            {!loading && (listings.length > 0 || accounts.length > 0)
              ? getFilteredListings(
                  listings.length > 0 ? listings : accounts[0].listings,
                ).map((listing, i) => (
                  <div
                    key={i}
                    className="group bg-white border border-black/5 rounded-2xl p-5 space-y-4 transition-all duration-500 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-400/5"
                  >
                    {/* Header: Logo + Title + Badge */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {listing.logoUrl ? (
                          <img
                            src={listing.logoUrl}
                            alt="Logo"
                            className="w-12 h-12 rounded-2xl object-cover border border-black/5"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-black/5 text-slate-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-500">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3
                            className="font-black text-sm text-black truncate uppercase tracking-tight"
                            title={listing.title}
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {listing.title}
                          </h3>
                          {getVerificationBadge(listing)}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {listing.categories?.primaryCategory?.displayName ||
                            "Business Profile"}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-black/5">
                          <Phone className="w-3 h-3 text-black" />
                        </div>
                        <span className="truncate">
                          {listing.phoneNumbers?.primaryPhone || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-black/5">
                          <Globe className="w-3 h-3 text-black" />
                        </div>
                        {listing.websiteUri ? (
                          <a
                            href={listing.websiteUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:text-yellow-600 transition-colors"
                          >
                            {listing.websiteUri}
                          </a>
                        ) : (
                          <span className="text-slate-300 italic">
                            No Website
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/5">
                      <button
                        onClick={() => handleListingData(listing)}
                        className="btn-ghost py-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        <LayoutDashboard className="w-3 h-3" /> Manage
                      </button>
                      <button
                        onClick={() => handleViewPerformanceInsights(listing)}
                        className="btn-lemon py-3 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-none border-none"
                      >
                        <BarChart3 className="w-3 h-3" /> Insights
                      </button>
                    </div>
                  </div>
                ))
              : !loading && (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-black/5">
                      <Building2 className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-black font-black uppercase tracking-tight mb-2">
                      No Profiles Found
                    </h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                      Link your Google Business Profile to start optimizing your
                      digital presence.
                    </p>
                    <button
                      onClick={() =>
                        signIn("google", { callbackUrl: "/dashboard" })
                      }
                      className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      Connect Now ↗
                    </button>
                  </div>
                )}
          </div>
        </div>

        {/* --- Facebook Column --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <Facebook className="w-5 h-5 text-yellow-400" />
                </div>
                <h2
                  className="font-black text-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Facebook
                </h2>
              </div>
              {facebookPages.length > 0 && (
                <span className="text-[10px] bg-black text-yellow-400 font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {facebookPages.length} Pages
                </span>
              )}
            </div>
          </div>

          <div
            className="overflow-y-auto p-6 space-y-4 custom-scroll"
            style={{ height: "calc(100vh - 380px)" }}
          >
            {facebookPages.length > 0 ? (
              <>
                {facebookPages.map((page) => (
                  <div
                    key={page.pageId}
                    className="bg-white border border-black/5 rounded-3xl p-5 space-y-4 hover:border-yellow-400 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm text-black uppercase tracking-tight">
                          {page.pageName}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          ID: {page.pageId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDisconnectFacebook(page.pageId)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => router.push(`/post-management`)}
                      className="btn-lemon w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Open Planner
                    </button>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => {
                      const userId = localStorage.getItem("userId");
                      window.location.href = `/api/facebook/login?userId=${userId}`;
                    }}
                    className="btn-ghost w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Link Another Page
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("Logout from Facebook?")) return;
                      const userId = localStorage.getItem("userId");
                      const res = await fetch("/api/meta-logout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId,
                          facebook: true,
                          instagram: false,
                        }),
                      });
                      if ((await res.json()).success) {
                        setFacebookPages([]);
                        toast.success("Facebook disconnected");
                      }
                    }}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-colors"
                  >
                    Disconnect Facebook
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-black/5">
                  <Facebook className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-black font-black uppercase tracking-tight mb-2">
                  Meta Ads & Posts
                </h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                  Connect your Facebook pages to manage all social interactions
                  from one hub.
                </p>
                <button
                  onClick={() => {
                    const userId = localStorage.getItem("userId");
                    window.location.href = `/api/facebook/login?userId=${userId}`;
                  }}
                  className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Authorize Meta ↗
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Instagram Column --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <Instagram className="w-5 h-5 text-yellow-400" />
                </div>
                <h2
                  className="font-black text-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Instagram
                </h2>
              </div>
              {instagramPages.length > 0 && (
                <span className="text-[10px] bg-black text-yellow-400 font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {instagramPages.length} Profiles
                </span>
              )}
            </div>
          </div>

          <div
            className="overflow-y-auto p-6 space-y-4 custom-scroll"
            style={{ height: "calc(100vh - 380px)" }}
          >
            {instagramPages.length > 0 ? (
              <>
                {instagramPages.map((page) => (
                  <div
                    key={page.igId}
                    className="bg-white border border-black/5 rounded-3xl p-5 space-y-4 hover:border-yellow-400 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm text-black uppercase tracking-tight">
                          @{page.igUsername}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          IGID: {page.igId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDisconnectInstagram(page.igId)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/post-management?pageId=${page.igId}`)
                      }
                      className="btn-lemon w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Manage Feed
                    </button>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => {
                      const userId = localStorage.getItem("userId");
                      window.location.href = `/api/instagram/login?userId=${userId}`;
                    }}
                    className="btn-ghost w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add IG Account
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("Logout from Instagram?")) return;
                      const userId = localStorage.getItem("userId");
                      const res = await fetch("/api/meta-logout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId,
                          facebook: false,
                          instagram: true,
                        }),
                      });
                      if ((await res.json()).success) {
                        setInstagramPages([]);
                        toast.success("Instagram disconnected");
                      }
                    }}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-colors"
                  >
                    Disconnect Instagram
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-black/5">
                  <Instagram className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-black font-black uppercase tracking-tight mb-2">
                  Visual Marketing
                </h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                  Connect your business Instagram to automate posts and track
                  engagement trends.
                </p>
                <button
                  onClick={() => {
                    const userId = localStorage.getItem("userId");
                    window.location.href = `/api/instagram/login?userId=${userId}`;
                  }}
                  className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Link Instagram ↗
                </button>
              </div>
            )}
          </div>
        </div>

        <SupportModal showToast={showToast} />
      </main>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
