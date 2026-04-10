"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
import {
  MapPin,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  Star,
  Building2,
  Plus,
  ArrowUpRight,
  BarChart3,
  X,
  PlusSquare,
  QrCode,
  RefreshCw,
  Activity,
  LogOut,
  Facebook,
  Instagram,
  FolderKey,
  SquareChartGantt,
  Search,
  ExternalLink,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Actions & Utils
import { fetchAllPostsAction } from "../actions/postActions";
import { fetchGMBAccounts } from "@/utils/fetchGMBAccounts";
import { fetchAllLocationsByAccount } from "@/utils/fetchAllLocationsByAccount";
import { checkVoiceOfMerchant } from "@/utils/checkVoiceOfMerchant";
import { fetchLocationLogo } from "@/utils/fetchLocationLogo";
import { storeUserListingsForAdmin } from "@/utils/storeUserListingsForAdmin";
import { fetchLocationInsights } from "@/utils/fetchLocationInsights";
import { fetchSearchKeywords } from "@/utils/fetchSearchKeywords";
import { getPerformanceInsightsWindows } from "@/lib/performanceInsightsUtils";

// Modals
import SupportModal from "../../components/SupportModal";
import FirstPostModal from "@/components/FirstPostModal";
import PerformanceInsightsModal from "@/components/PerformanceInsightsModal";
import InsightsModal from "@/components/modals/InsightsModal";
import SessionExpiredModal from "@/components/modals/SessionExpiredModal";
import ConnectModal from "@/components/modals/ConnectModal";

/* ── SUB-COMPONENT: Quick Action Card ── */
const QuickActionCard = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center p-5 rounded-3xl transition-all duration-300 cursor-pointer border bg-white border-slate-100 hover:border-yellow-400 hover:shadow-lg hover:bg-slate-900 hover:scale-105"
  >
    {/* Free Badge */}
    {item.isFree && (
      <span className="absolute top-3 right-3 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
        Free
      </span>
    )}

    {/* Icon */}
    <div className="mb-3 p-3 rounded-2xl transition-colors bg-slate-50 text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600">
      {React.cloneElement(item.icon, { size: 24 })}
    </div>

    {/* Label */}
    <span className="text-[11px] font-bold uppercase tracking-tight text-center leading-tight text-slate-600 transition-colors duration-300 group-hover:text-white">
      {item.label}
    </span>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Core State
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [listings, setListings] = useState([]);

  // Platform States
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramPages, setInstagramPages] = useState([]);

  // Modal & Flow States
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  console.log("Insights Data State in Dashboard:", insightsData);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedListingTitle, setSelectedListingTitle] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [showFirstPostModal, setShowFirstPostModal] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Performance Insights States
  const [showPerformanceInsightsModal, setShowPerformanceInsightsModal] =
    useState(false);
  const [performanceInsightsData, setPerformanceInsightsData] = useState(null);
  const [performanceInsightsLoading, setPerformanceInsightsLoading] =
    useState(false);
  const [selectedPerformanceLocation, setSelectedPerformanceLocation] =
    useState(null);
  const [performanceSearchKeywords, setPerformanceSearchKeywords] =
    useState(null);
  const [performanceInsightsDateRange, setPerformanceInsightsDateRange] =
    useState({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });

  const fetchInProgress = useRef(false);
  const CACHE_EXPIRY_MS = 10 * 60 * 1000;

  /* ── NAVIGATION CONFIG ── */
  const navItems = [
    {
      href: "/dashboard",
      icon: <SquareChartGantt />,
      label: "GMB Insights",
      isFree: true,
      isAction: true,
    },
    {
      href: "/gmb-health",
      icon: <Activity />,
      label: "GMB Health",
      isFree: true,
    },
    {
      href: "/get-magic-qr",
      icon: <QrCode />,
      label: "Magic QR",
      isFree: true,
    },
    {
      href: "/review-management",
      icon: <Star />,
      label: "Review Reply",
      isFree: true,
    },
    {
      href: "/keyword-planner",
      icon: <FolderKey />,
      label: "Keyword Planner",
      isFree: true,
    },
    {
      href: "/build-website",
      icon: <Globe />,
      label: "Website Builder",
      isFree: true,
    },
    { href: "/post-management", icon: <PlusSquare />, label: "Create Post" },
  ];

  /* ── DATA FETCHING LOGIC ── */
  const fetchInitialData = useCallback(
    async (forceRefresh = false) => {
      if (!session?.accessToken || !session?.user?.email) {
        if (status === "authenticated") setIsSessionExpired(true);
        return;
      }

      const userEmail = session.user.email;
      const cacheKey = `gmb_data_${userEmail}`;

      if (!forceRefresh) {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey));
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
          setAccounts(cached.accounts || []);
          return;
        }
      }

      if (fetchInProgress.current) return;
      fetchInProgress.current = true;
      setLoading(true);

      try {
        const accountsData = await fetchGMBAccounts(session.accessToken);

        console.log("Fetched GMB Accounts:", accountsData);
        if (accountsData.length === 0) {
          setAccounts([]);
          setLoading(false);
          fetchInProgress.current = false;
          return;
        }

        const listingsPromises = accountsData.map(async (account) => {
          const accountId = account.name.replace("accounts/", "");
          try {
            const locations = await fetchAllLocationsByAccount(
              session.accessToken,
              accountId,
            );
            if (locations?.length > 0) {
              return await Promise.all(
                locations.map(async (loc) => {
                  const vomStatus = await checkVoiceOfMerchant(
                    session.accessToken,
                    loc.name,
                  );
                  const logoUrl = await fetchLocationLogo(
                    session.accessToken,
                    `accounts/${accountId}/${loc.name}`,
                  );
                  return {
                    ...loc,
                    accountId,
                    accountName: account.accountName || account.name,
                    hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
                    logoUrl,
                  };
                }),
              );
            }
          } catch (err) {
            console.error(err);
          }
          return [];
        });

        const results = await Promise.all(listingsPromises);
        const allListings = results.flat();
        const newAccounts = [{ email: userEmail, listings: allListings }];

        setAccounts(newAccounts);
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ accounts: newAccounts, timestamp: Date.now() }),
        );
        await storeUserListingsForAdmin(userEmail, allListings);
      } catch (error) {
        if (error.message.includes("401") || error.message.includes("403"))
          setIsSessionExpired(true);
        toast.error("Google sync failed. Please check your connection.");
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [session, status],
  );

  const fetchMetaPlatforms = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const [fbRes, igRes] = await Promise.all([
        fetch(`/api/facebook/pages?userId=${userId}`),
        fetch(`/api/instagram/pages?userId=${userId}`),
      ]);
      const fbData = await fbRes.json();
      const igData = await igRes.json();
      if (fbData.success) setFacebookPages(fbData.pages);
      if (igData.success) setInstagramPages(igData.pages);
    } catch (err) {
      console.error("Meta fetch error", err);
    }
  }, []);

  /* ── EFFECTS ── */
  useEffect(() => {
    fetchInitialData();
    fetchMetaPlatforms();

    // Check if user has posts
    const checkPosts = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const res = await fetchAllPostsAction(userId);
      if (res.success && res.data.length === 0) {
        setTimeout(() => setShowFirstPostModal(true), 3000);
      }
    };
    checkPosts();

    if (
      searchParams?.get("fb") === "connected" ||
      searchParams?.get("ig") === "connected"
    ) {
      toast.success("Platform connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchInitialData, fetchMetaPlatforms, searchParams, router]);

  useEffect(() => {
    const allListings =
      listings.length > 0 ? listings : accounts[0]?.listings || [];
    const total = allListings.length;
    const verified = allListings.filter(
      (l) => l.hasVoiceOfMerchant === true,
    ).length;
    const unverified = total - verified;
    setSummary({ total, verified, unverified });

    if (allListings.length > 0) {
      const details = allListings.map((l) => ({
        locationId: l.name.split("/")[1],
        title: l.title,
        isVerified: l.hasVoiceOfMerchant === true,
        businessProfileId: l.name,
        ...l,
      }));
      localStorage.setItem("locationDetails", JSON.stringify(details));
    }
  }, [accounts, listings]);

  /* ── HANDLERS ── */
  const handleManualRefresh = () => {
    toast.success("Refreshing system data...");
    fetchInitialData(true);
  };

  const handleViewPerformanceInsights = async (listing) => {
    const locationId = listing.name.split("/")[1];
    setShowPerformanceInsightsModal(true);
    setPerformanceInsightsLoading(true);
    setSelectedPerformanceLocation({
      name: listing.title,
      id: locationId,
      businessProfileId: listing.name,
    });

    try {
      const { fetchStart, reportEnd } = getPerformanceInsightsWindows(
        performanceInsightsDateRange.startDate,
        performanceInsightsDateRange.endDate,
      );
      const insights = await fetchLocationInsights(
        session.accessToken,
        locationId,
        fetchStart,
        reportEnd,
      );
      setPerformanceInsightsData(insights);

      const keywords = await fetchSearchKeywords(
        session.accessToken,
        locationId,
        { year: 2024, month: 1 },
        { year: 2025, month: 1 },
      );
      setPerformanceSearchKeywords(
        keywords?.searchKeywordsCounts || keywords || null,
      );
    } catch (err) {
      toast.error("Could not load insights.");
    } finally {
      setPerformanceInsightsLoading(false);
    }
  };

  const handleGmbInsightsClick = () => {
    const allListings = accounts[0]?.listings || [];
    if (allListings.length === 0) return toast.error("Connect GMB first.");
    if (allListings.length === 1) handleViewPerformanceInsights(allListings[0]);
    else router.push("/gmb-insights");
  };

  /* ── RENDER HELPERS ── */
  const getFilteredListings = () => {
    const base = listings.length > 0 ? listings : accounts[0]?.listings || [];
    if (filterStatus === "verified")
      return base.filter((l) => l.hasVoiceOfMerchant === true);
    if (filterStatus === "unverified")
      return base.filter((l) => l.hasVoiceOfMerchant === false);
    return base;
  };

  /* ── LOADING STATE ── */
  if (status === "loading") {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-yellow-400 rounded-full animate-spin" />
          <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500 w-6 h-6 animate-pulse" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
          Initializing System
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* ── Modals ── */}
      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        insights={insightsData}
        loading={insightsLoading}
      />
      <PerformanceInsightsModal
        isOpen={showPerformanceInsightsModal}
        onClose={() => setShowPerformanceInsightsModal(false)}
        insightsData={performanceInsightsData}
        loading={performanceInsightsLoading}
        locationId={selectedPerformanceLocation?.id}
        businessName={selectedPerformanceLocation?.name}
        dateRange={performanceInsightsDateRange}
        searchKeywords={performanceSearchKeywords}
      />
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onLogin={() => signIn("google", { callbackUrl: "/dashboard" })}
      />
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
      {showFirstPostModal && (
        <FirstPostModal
          onClose={() => setShowFirstPostModal(false)}
          onCreate={() => router.push("/post-management")}
        />
      )}

      {/* ── Dashboard Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            System <span className="text-yellow-500">Dashboard</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Welcome back, {session?.user?.name || "User"}
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-100 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
            Sync Platforms
          </button>
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {navItems.map((item) => (
          <QuickActionCard
            key={item.label}
            item={item}
            isActive={pathname === item.href}
            onClick={
              item.isAction
                ? handleGmbInsightsClick
                : () => router.push(item.href)
            }
          />
        ))}
      </div>

      {/* ── Main Dashboard Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Google Business Column --- */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-600">
                <Building2 size={20} />
              </div>
              <h2 className="font-bold text-slate-900 tracking-tight uppercase text-sm">
                Google Business
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-full">
                {summary.total}
              </span>
              <button
                onClick={() => fetchInitialData(true)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] p-4 space-y-4 custom-scroll-main">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-slate-50 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Syncing Locations...
                </p>
              </div>
            ) : getFilteredListings().length > 0 ? (
              getFilteredListings().map((listing, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-3xl border border-slate-50 bg-white hover:border-yellow-400/50 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0">
                      {listing.logoUrl ? (
                        <img
                          src={listing.logoUrl}
                          className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                          <Building2 size={22} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-yellow-600 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                        {listing.hasVoiceOfMerchant
                          ? "✅ Verified Profile"
                          : "❌ Unverified Profile"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push("/post-management")}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-md"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleViewPerformanceInsights(listing)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white hover:border-yellow-400 hover:shadow-sm"
                    >
                      Insights
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center px-10">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Building2 size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  No Profiles Found
                </h3>
                <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                  Connect your Google Business Profile to start automating your
                  growth.
                </p>
                <button
                  onClick={() => signIn("google")}
                  className="w-full py-3 rounded-2xl bg-yellow-400 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-yellow-100 hover:scale-105 transition-all"
                >
                  Connect Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Facebook Column --- */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Facebook size={20} />
              </div>
              <h2 className="font-bold text-slate-900 tracking-tight uppercase text-sm">
                Facebook
              </h2>
            </div>
            {facebookPages.length > 0 && (
              <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-full">
                {facebookPages.length}
              </span>
            )}
          </div>

          <div className="flex-1 p-4 space-y-4">
            {facebookPages.length > 0 ? (
              facebookPages.map((page) => (
                <div
                  key={page.pageId}
                  className="group p-5 rounded-3xl border border-slate-50 bg-white hover:border-blue-400/50 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {page.pageName}
                    </p>
                    <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/post-management")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  >
                    Manage Channel
                  </button>
                </div>
              ))
            ) : (
              <div className="py-16 text-center px-10">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Facebook size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-6 tracking-tight uppercase">
                  Scale With Facebook
                </h3>
                <button
                  onClick={() =>
                    (window.location.href = `/api/facebook/login?userId=${localStorage.getItem("userId")}`)
                  }
                  className="w-full py-3 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  Connect Page
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Instagram Column --- */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600">
                <Instagram size={20} />
              </div>
              <h2 className="font-bold text-slate-900 tracking-tight uppercase text-sm">
                Instagram
              </h2>
            </div>
            {instagramPages.length > 0 && (
              <span className="text-[10px] font-black bg-pink-600 text-white px-2.5 py-1 rounded-full">
                {instagramPages.length}
              </span>
            )}
          </div>

          <div className="flex-1 p-4 space-y-4">
            {instagramPages.length > 0 ? (
              instagramPages.map((page) => (
                <div
                  key={page.igId}
                  className="group p-5 rounded-3xl border border-slate-50 bg-white hover:border-pink-400/50 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-slate-900 text-sm group-hover:text-pink-600 transition-colors">
                      @{page.igUsername}
                    </p>
                    <span className="text-[9px] font-black uppercase text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/post-management")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-pink-600 hover:text-white hover:border-pink-600"
                  >
                    View Feed
                  </button>
                </div>
              ))
            ) : (
              <div className="py-16 text-center px-10">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Instagram size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-6 tracking-tight uppercase">
                  Build Your Brand
                </h3>
                <button
                  onClick={() =>
                    (window.location.href = `/api/instagram/login?userId=${localStorage.getItem("userId")}`)
                  }
                  className="w-full py-3 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                >
                  Connect Instagram
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SupportModal showToast={(msg) => toast(msg)} />

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/919289344726"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 fill-white"
        >
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </div>
  );
}
