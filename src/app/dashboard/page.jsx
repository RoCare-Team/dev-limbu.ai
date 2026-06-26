"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";

import { CheckCircle, XCircle, RefreshCw, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchAllPostsAction } from "../actions/postActions";
// import SupportModal from "../../components/SupportModal";
import FirstPostModal from "@/components/FirstPostModal";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";
import NavLinks from "@/components/dashboard/NavLinks";
import GMBColumn from "@/components/dashboard/GMBColumn";
import FacebookColumn from "@/components/dashboard/FacebookColumn";
import InstagramColumn from "@/components/dashboard/InstagramColumn";
import LinkedinColumn from "@/components/dashboard/LinkedinColumn";
import PinterestColumn from "@/components/dashboard/PinterestColumn";
import YouTubeColumn from "@/components/dashboard/YouTubeColumn";
import WhatsappColumn from "@/components/dashboard/WhatsappColumn";
import ConnectModal from "@/components/modals/ConnectModal";
import SessionExpiredModal from "@/components/modals/SessionExpiredModal";

// --- Hooks ---
import { useGMB } from "@/hooks/useGMB";
import { useFacebook } from "@/hooks/useFacebook";
import { useInstagram } from "@/hooks/useInstagram";
import { useLinkedin } from "@/hooks/useLinkedin";
import { usePinterest } from "@/hooks/usePinterest";
import { useYouTube } from "@/hooks/useYouTube";
import { useWhatsapp } from "@/hooks/useWhatsapp";
import {
  getLocalStorage,
  getSessionStorage,
  setLocalStorage,
} from "@/utils/storage";
import WhatsAppButton from "@/components/WhatsAppButton";

// --- API Helpers (Kept here for component specific fetch) ---
export async function fetchLocationInsights(
  accessToken,
  locationId,
  startDate,
  endDate,
) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

    console.log("📡 GMB API Request ─────────────────────────");
    console.log("📍 Location ID:", locationId);
    console.log("📅 Date Range:", {
      start: `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`,
      end: `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`,
    });
    console.log("🔗 URL:", url);
    console.log("────────────────────────────────────────────");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("📶 Response Status:", res.status, res.statusText);

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ GMB API Error Response:", errText);
      throw new Error(`Failed to fetch insights: ${errText}`);
    }

    const data = await res.json();

    console.log("✅ GMB API Raw Response ─────────────────────");
    console.log(JSON.stringify(data, null, 2));
    console.log("────────────────────────────────────────────");

    // Per-metric breakdown
    const series = data?.multiDailyMetricTimeSeries;
    if (series?.length) {
      console.log("📊 Metrics Breakdown ────────────────────────");
      const metricList = series[0]?.dailyMetricTimeSeries ?? series;
      metricList.forEach((m) => {
        const values = m?.timeSeries?.datedValues ?? [];
        const total = values.reduce(
          (sum, v) => sum + (parseInt(v.value) || 0),
          0,
        );
        console.log(`  • ${m.dailyMetric}`);
        console.log(
          `    Total: ${total} | Days with data: ${values.filter((v) => v.value).length}`,
        );
        console.log(
          `    Daily values:`,
          values.map(
            (v) =>
              `${v.date?.year}-${v.date?.month}-${v.date?.day}: ${v.value ?? 0}`,
          ),
        );
      });
      console.log("────────────────────────────────────────────");
    } else {
      console.warn("⚠️ No multiDailyMetricTimeSeries found in response");
    }

    return data;
  } catch (err) {
    console.error("❌ Fetch Insights Error:", err);
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
  const [activeTab, setActiveTab] = useState("gmb");

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
    handleManualRefresh,
    handleDisconnectGMB,
  } = useGMB(session, status, setUiState);

  const { facebookPages, setFacebookPages, handleDisconnectFacebook } =
    useFacebook(router, searchParams);

  const { instagramPages, setInstagramPages, handleDisconnectInstagram } =
    useInstagram(router, searchParams);

  const { linkedinPages, setLinkedinPages, handleDisconnectLinkedin } =
    useLinkedin(router, searchParams);

  const { pinterestProfiles, setPinterestProfiles, handleDisconnectPinterest } =
    usePinterest(router, searchParams);

  const { youtubeChannels, setYoutubeChannels, handleDisconnectYouTube } =
    useYouTube(router, searchParams);

  const {
    accountStatus: whatsappStatus,
    checking: whatsappChecking,
    signupWhatsapp,
    openWhatsappDashboard,
    checkWhatsappAccount,
    loading: whatsappLoading,
  } = useWhatsapp();

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

  // When admin is impersonating, use the stored user name/email instead of NextAuth session
  const isImpersonating =
    typeof window !== "undefined" &&
    (localStorage.getItem("isImpersonating") === "true" ||
      sessionStorage.getItem("isImpersonating") === "true");
  const displayName = isImpersonating
    ? getLocalStorage("userName") ||
      getSessionStorage("userName") ||
      getLocalStorage("fullName") ||
      getSessionStorage("fullName") ||
      session?.user?.name ||
      "User"
    : session?.user?.name || "User";

  // WhatsApp uses ONLY the locally stored credentials (not NextAuth)
  const whatsappName = getLocalStorage("fullName") || "";
  const whatsappEmail =
    getLocalStorage("email") || getLocalStorage("userEmail") || "";

  // Check (server-side SSO) whether a WhatsApp account already exists.
  // Email ALWAYS comes from localStorage on page load (not NextAuth).
  useEffect(() => {
    const email = getLocalStorage("email") || getLocalStorage("userEmail") || "";

    if (!email) {
      console.warn("[WhatsApp] No email in localStorage — skipping account check");
      return;
    }

    console.log("[WhatsApp] Checking account on load for:", email);
    checkWhatsappAccount(email);
  }, [checkWhatsappAccount]);

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

  // Flexible Logout Handler (Revoke Meta Permissions)
  const handleMetaLogout = useCallback(async (type = "both") => {
    const isFb = type === "facebook" || type === "both";
    const isIg = type === "instagram" || type === "both";

    const activeId = getLocalStorage("userId"); // ya getLocalStorage("userId")
    if (!activeId) return toast.error("Login first");

    try {
      // Facebook disconnect
      if (isFb) {
        const res = await fetch(`/api/facebook/disconnect?userId=${activeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // empty = sab delete
        });
        const data = await res.json();
        if (data.success) setFacebookPages([]);
      }

      // Instagram disconnect
      if (isIg) {
        const res = await fetch(
          `/api/instagram/disconnect?userId=${activeId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // empty = sab delete
          },
        );
        const data = await res.json();
        if (data.success) setInstagramPages([]);
      }

      const platformName =
        type === "both"
          ? "Facebook & Instagram"
          : type === "facebook"
            ? "Facebook"
            : "Instagram";

      toast.success(`Successfully disconnected ${platformName}`);
    } catch (err) {
      toast.error("Disconnect failed");
    }
  }, []);

  useEffect(() => {
    let timerId = null;
    const fetchPosts = async () => {
      try {
        const userId = getLocalStorage("userId");
        if (!userId) return; // Wait until userId is available
        const allPostsData = await fetchAllPostsAction(userId);
        if (
          allPostsData.success &&
          (allPostsData.pagination?.totalItems === 0 ||
            allPostsData.data.length === 0)
        ) {
          timerId = setTimeout(() => {
            setUiState((prev) => ({ ...prev, showFirstPostModal: true }));
          }, 3000);
        }
      } catch (err) {
        console.error(err.message || "Error fetching posts");
      }
    };
    fetchPosts();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
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

  const handleListingData = useCallback(
    (listing) => {
      router.push("/post-management");
    },
    [router],
  );

  // Handle View Performance Insights
  const handleViewPerformanceInsights = useCallback(
    async (listing, customStartDate = null, customEndDate = null) => {
      const locationId = listing?.name?.split("/")[1];

      // Determine dates using parameters or current state
      const startDate = customStartDate || performanceState.dateRange.startDate;
      const endDate = customEndDate || performanceState.dateRange.endDate;
      const reportStart =
        startDate instanceof Date ? startDate : new Date(startDate);
      const reportEnd = endDate instanceof Date ? endDate : new Date(endDate);
      const { fetchStart, reportEnd: insightSeriesEnd } =
        getPerformanceInsightsWindows(reportStart, reportEnd);

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
        const insights = await fetchLocationInsights(
          session.accessToken,
          locationId,
          fetchStart,
          insightSeriesEnd,
        );

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
        const keywordsArray =
          keywords?.searchKeywordsCounts || keywords || null;

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
    },
    [session?.accessToken, performanceState.dateRange],
  );

  const handleLocationSelect = useCallback(
    (listing) => {
      setUiState((prev) => ({ ...prev, showLocationSelectorModal: false }));
      handleViewPerformanceInsights(listing);
    },
    [handleViewPerformanceInsights],
  );

  const handlePerformanceInsightsDateChange = useCallback(
    (dateRange) => {
      setPerformanceState((prev) => ({ ...prev, dateRange }));
      setPerformanceState((currentState) => {
        if (currentState.location) {
          const listing = {
            name: currentState.location.businessProfileId,
            title: currentState.location.name,
          };
          handleViewPerformanceInsights(
            listing,
            dateRange.startDate,
            dateRange.endDate,
          );
        }
        return currentState;
      });
    },
    [handleViewPerformanceInsights],
  );

  // Store location details in localStorage
  useEffect(() => {
    if (activeListings.length > 0) {
      const locationDetails = activeListings?.map((item) => {
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
      setLocalStorage(
        "reviewUrl",
        activeListings[0].metadata?.newReviewUri || "",
      );
    }
  }, [activeListings]);
  const handleAddProject = useCallback(async () => {
    if (!session) {
      await signIn("google", { redirect: false });
      return;
    }
    if (accounts.length >= maxAccounts) {
      toast.error(`⚠️ ${userPlan} plan allows only ${maxAccounts} profiles.`);
      return;
    }
    await fetchInitialData(true);
  }, [session, accounts.length, maxAccounts, userPlan, fetchInitialData]);

  const getVerificationBadge = useCallback((listing) => {
    const isVerified = listing.hasVoiceOfMerchant === true;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${isVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
      >
        {isVerified ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <XCircle className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {isVerified ? "Verified" : "Unverified"}
        </span>
        <span className="sm:hidden">{isVerified ? "✓" : "✗"}</span>
      </span>
    );
  }, []);

  const getFilteredListings = useCallback(
    (listings) => {
      if (filterStatus === "verified")
        return listings.filter((l) => l.hasVoiceOfMerchant === true);
      if (filterStatus === "unverified")
        return listings.filter((l) => l.hasVoiceOfMerchant !== true);
      return listings;
    },
    [filterStatus],
  );

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#eab308" }} />
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-8 text-sm">
            Initializing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const tabData = [
    {
      id: "gmb",
      label: "GMB Profile",
      icon: "/social-icon/gmb-icon.png",
      count: accounts.length > 0 ? summary.total : 0,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "/social-icon/facebook-icon.png",
      count: facebookPages.length,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: "/social-icon/instagram-icon.png",
      count: instagramPages.length,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: "/social-icon/linkedin.png",
      count: linkedinPages?.length || 0,
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: "/social-icon/youtube-icon.svg",
      count: youtubeChannels?.length || 0,
    },
    {
      id: "pinterest",
      label: "Pinterest",
      icon: "/social-icon/pinterest-icon.png",
      count: pinterestProfiles?.length || 0,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "/social-icon/whatsaap-icon.png",
      count: whatsappStatus?.exists ? 1 : 0,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PerformanceInsightsModal
        isOpen={performanceState.isOpen}
        onClose={() =>
          setPerformanceState((prev) => ({ ...prev, isOpen: false }))
        }
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
        onClose={() =>
          setUiState((prev) => ({ ...prev, isConnectModalOpen: false }))
        }
      />

      {uiState.showLocationSelectorModal && (
        <LocationSelectionModal
          isOpen={uiState.showLocationSelectorModal}
          onClose={() =>
            setUiState((prev) => ({
              ...prev,
              showLocationSelectorModal: false,
            }))
          }
          locations={
            accounts.length > 0 ? accounts.flatMap((acc) => acc.listings) : []
          }
          onSelect={handleLocationSelect}
        />
      )}

      <Toaster position="top-right" />

      {uiState.showFirstPostModal && (
        <FirstPostModal
          onClose={() =>
            setUiState((prev) => ({ ...prev, showFirstPostModal: false }))
          }
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
                <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-700">
                  Live Dashboard
                </span>
              </div>
              <h1 className="text-xl sm:text-xl font-bold text-slate-800 uppercase tracking-tight">
                Welcome,{" "}
                <span className="text-yellow-500">
                  {displayName.split(" ")[0]}
                </span>{" "}
                👋
              </h1>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {accounts.length > 0 && (
                <>
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="btn-ghost btn-sm gap-2 border border-slate-300 shadow-sm hover:border-slate-400"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    <span>Refresh Data</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Tab Navigation --- */}
      <div className="mt-6 mb-4 flex gap-3 overflow-x-auto custom-scroll pb-4 px-2 sm:px-0">
        {tabData.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 whitespace-nowrap font-bold text-xs uppercase tracking-wider transition-all duration-300 shrink-0 ${
              activeTab === tab.id
                ? "bg-yellow-50 border-yellow-300 text-slate-800 shadow-md ring-2 ring-yellow-400/20"
                : "bg-white border-slate-200 text-slate-500 hover:border-yellow-300 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className="w-5 h-5 object-contain"
            />
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] shadow-sm ${
                  activeTab === tab.id
                    ? "bg-yellow-400 text-black"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="w-full pb-10 bg-slate-50/30">
        {activeTab === "gmb" && (
          <GMBColumn
            summary={summary}
            handleAddProject={handleAddProject}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            loading={loading}
            listings={activeListings}
            getFilteredListings={getFilteredListings}
            getVerificationBadge={getVerificationBadge}
            handleListingData={handleListingData}
            handleViewPerformanceInsights={handleViewPerformanceInsights}
            handleDisconnectGMB={handleDisconnectGMB}
          />
        )}

        {activeTab === "facebook" && (
          <FacebookColumn
            facebookPages={facebookPages}
            setFacebookPages={setFacebookPages}
            handleDisconnectFacebook={handleDisconnectFacebook}
            handleMetaLogout={() => handleMetaLogout("facebook")}
          />
        )}

        {activeTab === "instagram" && (
          <InstagramColumn
            instagramPages={instagramPages}
            setInstagramPages={setInstagramPages}
            handleDisconnectInstagram={handleDisconnectInstagram}
            handleMetaLogout={() => handleMetaLogout("instagram")}
          />
        )}

        {activeTab === "linkedin" && (
          <LinkedinColumn
            linkedinPages={linkedinPages}
            setLinkedinPages={setLinkedinPages}
            handleDisconnectLinkedin={handleDisconnectLinkedin}
          />
        )}

        {activeTab === "pinterest" && (
          <PinterestColumn
            pinterestProfiles={pinterestProfiles}
            setPinterestProfiles={setPinterestProfiles}
            handleDisconnectPinterest={handleDisconnectPinterest}
          />
        )}

        {activeTab === "youtube" && (
          <YouTubeColumn
            youtubeChannels={youtubeChannels}
            setYoutubeChannels={setYoutubeChannels}
            handleDisconnectYouTube={handleDisconnectYouTube}
          />
        )}

        {activeTab === "whatsapp" && (
          <WhatsappColumn
            accountStatus={whatsappStatus}
            checking={whatsappChecking}
            signupWhatsapp={signupWhatsapp}
            openWhatsappDashboard={openWhatsappDashboard}
            loading={whatsappLoading}
            userName={whatsappName}
            userEmail={whatsappEmail}
          />
        )}

        {/* <SupportModal showToast={showToast} /> */}
        <WhatsAppButton />
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
