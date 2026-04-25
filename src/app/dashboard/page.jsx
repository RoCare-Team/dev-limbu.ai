"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";

import {
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchAllPostsAction } from "../actions/postActions";
import SupportModal from "../../components/SupportModal";
import FirstPostModal from "@/components/FirstPostModal";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";
import NavLinks from "@/components/dashboard/NavLinks";
import GMBColumn from "@/components/dashboard/GMBColumn";
import FacebookColumn from "@/components/dashboard/FacebookColumn";
import InstagramColumn from "@/components/dashboard/InstagramColumn";
import ConnectModal from "@/components/modals/ConnectModal";
import SessionExpiredModal from "@/components/modals/SessionExpiredModal";

// --- Hooks ---
import { useGMB } from "@/hooks/useGMB";
import { useFacebook } from "@/hooks/useFacebook";
import { useInstagram } from "@/hooks/useInstagram";
import { getLocalStorage, setLocalStorage } from "@/utils/storage";

// --- API Helpers (Kept here for component specific fetch) ---
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

// --- Main Dashboard Component ---
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [filterStatus, setFilterStatus] = useState("all");

  // --- Consolidated UI State ---
  const [uiState, setUiState] = useState({
    isConnectModalOpen: false,
    showFirstPostModal: false,
    isSessionExpired: false,
    showLocationSelectorModal: false,
  });

  // --- Consolidate Hooks ---
  const {
    accounts,
    loading,
    listings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh
  } = useGMB(session, status, setUiState);

  const {
    facebookPages,
    setFacebookPages,
    handleDisconnectFacebook
  } = useFacebook(router, searchParams);

  const {
    instagramPages,
    setInstagramPages,
    handleDisconnectInstagram
  } = useInstagram(router, searchParams);

  // --- Consolidated Performance Insights State ---
  const [performanceState, setPerformanceState] = useState({
    isOpen: false,
    loading: false,
    data: null,
    location: null,
    searchKeywords: null,
    dateRange: {
      startDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
      })(),
      endDate: new Date(),
    },
  });

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

  // Flexible Logout Handler (Revoke Meta Permissions)
  const handleMetaLogout = async (type = "both") => {
    const isFb = type === "facebook" || type === "both";
    const isIg = type === "instagram" || type === "both";

    const confirmMsg = type === "both"
      ? "Are you sure you want to fully logout from Facebook and Instagram?"
      : `Are you sure you want to logout from ${type === 'facebook' ? 'Facebook' : 'Instagram'}?`;

    if (!confirm(confirmMsg)) return;

    const userId = getLocalStorage("userId");
    if (!userId) return toast.error("Login first");

    try {
      const res = await fetch("/api/meta-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facebook: isFb, instagram: isIg }),
      });
      const data = await res.json();
      if (data.success) {
        if (isFb) setFacebookPages([]);
        if (isIg) setInstagramPages([]);

        const platformName = type === "both" ? "Facebook & Instagram" : (type === "facebook" ? "Facebook" : "Instagram");
        toast.success(`Successfully disconnected ${platformName}`);
      } else {
        toast.error("Logout failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    let timerId = null;
    const fetchPosts = async () => {
      try {
        const userId = getLocalStorage("userId");
        const allPostsData = await fetchAllPostsAction(userId);
        if (allPostsData.success && allPostsData.data.length === 0) {
          timerId = setTimeout(() => {
            setUiState((prev) => ({ ...prev, showFirstPostModal: true }));
          }, 3000);
        }
      } catch (err) {
        toast.error(err.message || "Error fetching posts", "error");
      }
    };
    fetchPosts();
    return () => { if (timerId) clearTimeout(timerId); };
  }, []);

  // Show connect modal for unauthenticated users after a delay
  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        setUiState((prev) => ({ ...prev, isConnectModalOpen: true }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const showToast = (message, type) => {
    if (type === "error") toast.error(message);
    else if (type === "success") toast.success(message);
    else toast(message);
  };

  const handleListingData = useCallback((listing) => {
    router.push("/post-management");
  }, [router]);

  // Handle View Performance Insights
  const handleViewPerformanceInsights = useCallback(async (
    listing,
    customStartDate = null,
    customEndDate = null,
  ) => {
    const locationId = listing?.name?.split("/")[1];

    // Determine dates using parameters or current state
    const startDate = customStartDate || performanceState.dateRange.startDate;
    const endDate = customEndDate || performanceState.dateRange.endDate;
    const reportStart = startDate instanceof Date ? startDate : new Date(startDate);
    const reportEnd = endDate instanceof Date ? endDate : new Date(endDate);
    const { fetchStart, reportEnd: insightSeriesEnd } = getPerformanceInsightsWindows(reportStart, reportEnd);

    setPerformanceState((prev) => ({
      ...prev,
      isOpen: true,
      loading: true,
      data: null,
      searchKeywords: null,
      location: {
        name: listing.title || "Unknown Listing",
        id: locationId,
        businessProfileId: listing.name,
        city: listing.storefrontAddress?.locality || "",
        locality: listing.storefrontAddress?.administrativeArea || "",
      },
    }));

    try {
      const insights = await fetchLocationInsights(session.accessToken, locationId, fetchStart, insightSeriesEnd);

      const currentDate = new Date();
      const startMonth = { year: currentDate.getFullYear(), month: currentDate.getMonth() - 3 };
      if (startMonth.month <= 0) { startMonth.month += 12; startMonth.year -= 1; }
      const endMonth = { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 };

      const keywords = await fetchSearchKeywords(session.accessToken, locationId, startMonth, endMonth);
      const keywordsArray = keywords?.searchKeywordsCounts || keywords || null;

      setPerformanceState((prevData) => ({
        ...prevData,
        data: insights,
        searchKeywords: keywordsArray,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching performance insights:", error);
      toast.error("Failed to load performance insights.");
      setPerformanceState((prevData) => ({ ...prevData, loading: false }));
    }
  }, [session?.accessToken, performanceState.dateRange]);



  const handleLocationSelect = useCallback((listing) => {
    setUiState((prev) => ({ ...prev, showLocationSelectorModal: false }));
    handleViewPerformanceInsights(listing);
  }, [handleViewPerformanceInsights]);

  const handlePerformanceInsightsDateChange = useCallback((dateRange) => {
    setPerformanceState((prev) => ({ ...prev, dateRange }));
    setPerformanceState((currentState) => {
      if (currentState.location) {
        const listing = { name: currentState.location.businessProfileId, title: currentState.location.name };
        handleViewPerformanceInsights(listing, dateRange.startDate, dateRange.endDate);
      }
      return currentState;
    });
  }, [handleViewPerformanceInsights]);

  // Store location details in localStorage
  useEffect(() => {
    if (activeListings.length > 0) {
      const locationDetails = activeListings.map((item) => {
        const locationId = item?.name?.split("/")[1];
        return {
          locationId,
          accountId: item.accountId || "",
          locality: item.storefrontAddress?.locality || "",
          address: item.storefrontAddress?.addressLines?.[0] || "",
          title: item.title || "",
          websiteUrl: item.websiteUri || "",
          reviewUri: item.metadata?.newReviewUri || "",
          isVerified: item.hasVoiceOfMerchant === true,
          businessProfileId: item.name || "",
          name: item.name,
          websiteUri: item.websiteUri,
          storefrontAddress: item.storefrontAddress,
          phoneNumbers: item.phoneNumbers,
          categories: item.categories,
          openInfo: item.openInfo,
          metadata: item.metadata,
        };
      });
      setLocalStorage("locationDetails", JSON.stringify(locationDetails));
      setLocalStorage("reviewUrl", activeListings[0].metadata?.newReviewUri || "");
    }
  }, [activeListings]);
  const handleAddProject = useCallback(async () => {
    if (!session) { await signIn("google", { redirect: false }); return; }
    if (accounts.length >= maxAccounts) {
      toast.error(`⚠️ ${userPlan} plan allows only ${maxAccounts} profiles.`);
      return;
    }
    await fetchInitialData(true);
  }, [session, accounts.length, maxAccounts, userPlan, fetchInitialData]);

  const getVerificationBadge = useCallback((listing) => {
    const isVerified = listing.hasVoiceOfMerchant === true;
    return (
      <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${isVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
        {isVerified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{isVerified ? "Verified" : "Unverified"}</span>
        <span className="sm:hidden">{isVerified ? "✓" : "✗"}</span>
      </span>
    );
  }, []);

  const getFilteredListings = useCallback((listings) => {
    if (filterStatus === "verified") return listings.filter((l) => l.hasVoiceOfMerchant === true);
    if (filterStatus === "unverified") return listings.filter((l) => l.hasVoiceOfMerchant === false);
    return listings;
  }, [filterStatus]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#eab308" }} />
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-8 text-sm">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PerformanceInsightsModal
        isOpen={performanceState.isOpen}
        onClose={() => setPerformanceState((prev) => ({ ...prev, isOpen: false }))}
        insightsData={performanceState.data}
        businessName={performanceState.location?.name || ""}
        locationName={performanceState.location?.name || ""}
        city={performanceState.location?.city || ""}
        locality={performanceState.location?.locality || ""}
        locationId={performanceState.location?.id || ""}
        businessProfileId={performanceState.location?.businessProfileId || ""}
        dateRange={performanceState.dateRange}
        searchKeywords={performanceState.searchKeywords}
        loading={performanceState.loading}
        onDateChange={handlePerformanceInsightsDateChange}
      />

      <SessionExpiredModal
        isOpen={uiState.isSessionExpired}
        onLogin={() => signIn("google", { callbackUrl: "/dashboard" })}
      />

      <ConnectModal
        isOpen={uiState.isConnectModalOpen}
        onClose={() => setUiState((prev) => ({ ...prev, isConnectModalOpen: false }))}
      />

      {uiState.showLocationSelectorModal && (
        <LocationSelectionModal
          isOpen={uiState.showLocationSelectorModal}
          onClose={() => setUiState((prev) => ({ ...prev, showLocationSelectorModal: false }))}
          locations={accounts.length > 0 ? accounts.flatMap((acc) => acc.listings) : []}
          onSelect={handleLocationSelect}
        />
      )}

      <Toaster position="top-right" />

      {uiState.showFirstPostModal && (
        <FirstPostModal
          onClose={() => setUiState((prev) => ({ ...prev, showFirstPostModal: false }))}
          onCreate={() => router.push("/post-management")}
        />
      )}

      <div className=" border-b border-black/5">
        <div className="w-full ">
          <NavLinks isAuthenticated={status === "authenticated"} />
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mt-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-yellow-500" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-700">Live Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter">
                Welcome, <span className="text-yellow-500">{session?.user?.name?.split(" ")[0] || "User"}</span> 👋
              </h1>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {accounts.length > 0 && (
                <>
                  <button onClick={handleManualRefresh} disabled={loading} className="btn-ghost btn-md gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh Data</span>
                  </button>

                  {(facebookPages.length > 0 || instagramPages.length > 0) && (
                    <button onClick={() => handleMetaLogout("both")} className="btn-ghost text-red-500 hover:bg-red-50 border-red-100 btn-md gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect FB/IG</span>
                    </button>
                  )}

                  <button onClick={() => signOut({ callbackUrl: "/dashboard" })} className="btn-lemon btn-md gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-0 bg-slate-50/30" style={{ height: "calc(100vh - 220px)" }}>
        <GMBColumn
          summary={summary}
          handleAddProject={handleAddProject}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          loading={loading}
          listings={listings}
          accounts={accounts}
          getFilteredListings={getFilteredListings}
          getVerificationBadge={getVerificationBadge}
          handleListingData={handleListingData}
          handleViewPerformanceInsights={handleViewPerformanceInsights}
        />
        <FacebookColumn
          facebookPages={facebookPages}
          setFacebookPages={setFacebookPages}
          handleDisconnectFacebook={handleDisconnectFacebook}
          handleMetaLogout={() => handleMetaLogout("facebook")}
        />
        <InstagramColumn
          instagramPages={instagramPages}
          setInstagramPages={setInstagramPages}
          handleDisconnectInstagram={handleDisconnectInstagram}
          handleMetaLogout={() => handleMetaLogout("instagram")}
        />
        <SupportModal showToast={showToast} />
      </main>
      <style jsx>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-left { animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
