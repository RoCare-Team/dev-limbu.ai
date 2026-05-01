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
  ArrowRight,
  ChevronRight,
  Plus,
  Lightbulb,
  TrendingUp,
  BarChart3,
  SquareChartGantt,
  Activity,
  QrCode,
  Star,
  Search,
  FolderKey,
  Globe,
  PlusSquare,
  Building2,
  Facebook,
  Instagram,
  BarChart2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { fetchAllPostsAction, getUserWalletAction } from "../actions/postActions";
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
import WhatsAppButton from "@/components/WhatsAppButton";

// --- API Helpers ---
export async function fetchLocationInsights(accessToken, locationId, startDate, endDate) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Failed to fetch insights`);
    return await res.json();
  } catch (err) { console.error(err); throw err; }
}

export async function fetchSearchKeywords(accessToken, locationId, startMonth, endMonth) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startMonth.year}&monthlyRange.start_month.month=${startMonth.month}&monthlyRange.end_month.year=${endMonth.year}&monthlyRange.end_month.month=${endMonth.month}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Failed to fetch search keywords`);
    return await res.json();
  } catch (err) { console.error(err); throw err; }
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [filterStatus, setFilterStatus] = useState("all");
  const [userWallet, setUserWallet] = useState(0);

  const [uiState, setUiState] = useState({
    isConnectModalOpen: false,
    showFirstPostModal: false,
    isSessionExpired: false,
    showLocationSelectorModal: false,
  });

  const { accounts, loading, listings, activeListings, summary, fetchInitialData, handleManualRefresh } = useGMB(session, status, setUiState);
  const { facebookPages, setFacebookPages, handleDisconnectFacebook } = useFacebook(router, searchParams);
  const { instagramPages, setInstagramPages, handleDisconnectInstagram } = useInstagram(router, searchParams);

  const [performanceState, setPerformanceState] = useState({
    isOpen: false,
    loading: false,
    data: null,
    location: null,
    searchKeywords: null,
    dateRange: { startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })(), endDate: new Date() },
  });

  const isImpersonating = typeof window !== "undefined" && localStorage.getItem("isImpersonating") === "true";
  const displayName = isImpersonating
    ? (localStorage.getItem("userName") || localStorage.getItem("fullName") || session?.user?.name || "User")
    : (session?.user?.name || "User");

  useEffect(() => {
    const fetchWallet = async () => {
      const userId = getLocalStorage("userId");
      if (!userId) return;
      try {
        const data = await getUserWalletAction(userId);
        setUserWallet(data?.wallet ?? data?.data?.wallet ?? 0);
      } catch (err) { console.error(err); }
    };
    fetchWallet();
  }, [session]);

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

  const handleMetaLogout = async (type = "both") => {
    if (!confirm("Are you sure?")) return;
    const userId = getLocalStorage("userId");
    if (!userId) return toast.error("Login first");
    try {
      const res = await fetch("/api/meta-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facebook: type === "facebook" || type === "both", instagram: type === "instagram" || type === "both" }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === "facebook" || type === "both") setFacebookPages([]);
        if (type === "instagram" || type === "both") setInstagramPages([]);
        toast.success("Disconnected successfully");
      }
    } catch (err) { toast.error("Logout failed"); }
  };

  useEffect(() => {
    let timerId = null;
    const fetchPosts = async () => {
      const userId = getLocalStorage("userId");
      if (!userId) return;
      const allPostsData = await fetchAllPostsAction(userId);
      if (allPostsData.success && (allPostsData.pagination?.totalItems === 0 || allPostsData.data.length === 0)) {
        timerId = setTimeout(() => setUiState(p => ({ ...p, showFirstPostModal: true })), 3000);
      }
    };
    fetchPosts();
    return () => { if (timerId) clearTimeout(timerId); };
  }, []);

  const handleViewPerformanceInsights = useCallback(async (listing, customStart = null, customEnd = null) => {
    const locationId = listing?.name?.split("/")[1];
    const startDate = customStart || performanceState.dateRange.startDate;
    const endDate = customEnd || performanceState.dateRange.endDate;
    const reportStart = new Date(startDate);
    const reportEnd = new Date(endDate);
    const { fetchStart, reportEnd: insightSeriesEnd } = getPerformanceInsightsWindows(reportStart, reportEnd);

    setPerformanceState(p => ({
      ...p, isOpen: true, loading: true, data: null, searchKeywords: null,
      location: { name: listing.title, id: locationId, businessProfileId: listing.name, city: listing.storefrontAddress?.locality, locality: listing.storefrontAddress?.administrativeArea }
    }));

    try {
      const insights = await fetchLocationInsights(session.accessToken, locationId, fetchStart, insightSeriesEnd);
      const currentDate = new Date();
      const startMonth = { year: currentDate.getFullYear(), month: currentDate.getMonth() - 2 };
      const endMonth = { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 };
      const keywords = await fetchSearchKeywords(session.accessToken, locationId, startMonth, endMonth);
      setPerformanceState(p => ({ ...p, data: insights, searchKeywords: keywords?.searchKeywordsCounts || null, loading: false }));
    } catch (error) { toast.error("Failed to load insights."); setPerformanceState(p => ({ ...p, loading: false })); }
  }, [session?.accessToken, performanceState.dateRange]);

  const handleLocationSelect = useCallback((listing) => {
    setUiState(p => ({ ...p, showLocationSelectorModal: false }));
    handleViewPerformanceInsights(listing);
  }, [handleViewPerformanceInsights]);

  const handlePerformanceInsightsDateChange = useCallback((dateRange) => {
    setPerformanceState(p => ({ ...p, dateRange }));
    const listing = { name: performanceState.location.businessProfileId, title: performanceState.location.name };
    handleViewPerformanceInsights(listing, dateRange.startDate, dateRange.endDate);
  }, [handleViewPerformanceInsights, performanceState.location]);

  useEffect(() => {
    if (activeListings.length > 0) {
      const locationDetails = activeListings.map(item => ({
        locationId: item?.name?.split("/")[1], accountId: item.accountId, title: item.title, websiteUrl: item.websiteUri, reviewUri: item.metadata?.newReviewUri, isVerified: item.hasVoiceOfMerchant === true, businessProfileId: item.name, ...item
      }));
      setLocalStorage("locationDetails", JSON.stringify(locationDetails));
      setLocalStorage("reviewUrl", activeListings[0].metadata?.newReviewUri || "");
    }
  }, [activeListings]);

  const handleAddProject = useCallback(async () => {
    if (!session) { await signIn("google", { redirect: false }); return; }
    if (accounts.length >= maxAccounts) { toast.error(`⚠️ Profile limit reached.`); return; }
    await fetchInitialData(true);
  }, [session, accounts.length, maxAccounts, fetchInitialData]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen bg-white"><CircularProgress size={60} sx={{ color: "#eab308" }} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-inter p-4">
      {/* Modals */}
      <PerformanceInsightsModal isOpen={performanceState.isOpen} onClose={() => setPerformanceState(p => ({ ...p, isOpen: false }))} insightsData={performanceState.data} businessName={performanceState.location?.name || ""} locationName={performanceState.location?.name || ""} city={performanceState.location?.city || ""} locality={performanceState.location?.locality || ""} locationId={performanceState.location?.id || ""} businessProfileId={performanceState.location?.businessProfileId || ""} dateRange={performanceState.dateRange} searchKeywords={performanceState.searchKeywords} loading={performanceState.loading} onDateChange={handlePerformanceInsightsDateChange} />
      <SessionExpiredModal isOpen={uiState.isSessionExpired} onLogin={() => signIn("google", { callbackUrl: "/dashboard" })} />
      <ConnectModal isOpen={uiState.isConnectModalOpen} onClose={() => setUiState(p => ({ ...p, isConnectModalOpen: false }))} />
      {uiState.showLocationSelectorModal && <LocationSelectionModal isOpen={uiState.showLocationSelectorModal} onClose={() => setUiState(p => ({ ...p, showLocationSelectorModal: false }))} locations={accounts.flatMap(acc => acc.listings)} onSelect={handleLocationSelect} />}
      <Toaster position="top-right" />
      {uiState.showFirstPostModal && <FirstPostModal onClose={() => setUiState(p => ({ ...p, showFirstPostModal: false }))} onCreate={() => router.push("/post-management")} />}

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* TOP SECTION: WELCOME + CREDITS */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Welcome Banner */}
          <div className="flex-1 min-w-0 bg-white rounded-[1.5rem] p-6 sm:p-8 relative overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="z-10 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-black mb-2">Welcome back, <span className="text-yellow-500">{displayName.split(" ")[0]} 👋</span></h1>
              <p className="text-slate-500 text-sm font-medium mb-4">Here's what you can do today</p>
              <div className="space-y-2">
                {["Create a new post", "Reply to reviews", "Check performance"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 justify-center md:justify-start">
                    <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center border border-green-100"><CheckCircle className="w-3 h-3 text-green-600" /></div>
                    <span className="text-xs font-semibold text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative w-40 h-40 shrink-0"><img src="/images/bg-logo.png" alt="dash" className="w-full h-full object-contain drop-shadow-xl relative z-10" /></div>
          </div>

          {/* Credits Balance */}
          <div className="w-full lg:w-80 shrink-0 bg-[#FFFBEB] p-6 sm:p-8 rounded-[1.5rem] border border-yellow-100 flex flex-col shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700/70">Credits Balance</p>
              <h3 className="text-2xl font-black text-slate-900">{userWallet.toLocaleString()} <span className="text-sm font-bold text-slate-400">Credits</span></h3>
            </div>
            <div className="space-y-2 py-4 border-y border-yellow-500/10 flex-1 flex flex-col justify-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used For:</p>
               {["AI Content Generation", "Image & Video Creation", "Automation Features"].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                   <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                   <span className="text-[10px] font-bold text-slate-700">{item}</span>
                 </div>
               ))}
            </div>
            <button onClick={() => router.push("/wallet")} className="w-full py-3 bg-[#FFCC00] hover:bg-[#FFD700] text-black rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 mt-4 transition-all">View Details <ArrowRight size={12} /></button>
          </div>
        </div>

        {/* MAIN BODY: QUICK ACCESS + ACTIVITY */}
        <div className="flex flex-col xl:flex-row gap-8">
          
          <div className="flex-1 space-y-8 min-w-0">
            {/* QUICK ACCESS */}
            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {[
                  { title: "Analytics", desc: "Track and improve performance", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50", items: [{ label: "GMB Insights", href: "/gmb-insights", icon: SquareChartGantt }, { label: "GMB Health", href: "/gmb-health", icon: Activity }] },
                  { title: "Growth Tools", desc: "Grow your audience", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", items: [{ label: "Magic QR", href: "/get-magic-qr", icon: QrCode }, { label: "Review Reply", href: "/review-management", icon: Star }] },
                  { title: "SEO", desc: "Rank higher on search", icon: Search, color: "text-blue-600", bg: "bg-blue-50", items: [{ label: "Keyword Planner", href: "/keyword-planner", icon: FolderKey }, { label: "Site Audit", href: "#", icon: Globe, disabled: true }] },
                  { title: "Creation", desc: "Build content easily", icon: Plus, color: "text-orange-600", bg: "bg-orange-50", items: [{ label: "Website Builder", href: "/build-website", icon: Globe }, { label: "Create Post", href: "/post-management", icon: PlusSquare }] },
                ].map((cat, i) => (
                  <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 hover:border-[#FFCC00]/50 transition-all shadow-sm flex flex-col group/card">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 ${cat.bg} rounded-lg`}><cat.icon className={`w-4 h-4 ${cat.color}`} /></div>
                      <ChevronRight className="w-4 h-4 text-slate-200" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">{cat.title}</h3>
                    <p className="text-[9px] text-slate-400 font-medium mb-4 leading-snug">{cat.desc}</p>
                    <div className="space-y-1.5 mt-auto">
                      {cat.items.map((it, j) => (
                        <button key={j} onClick={() => !it.disabled && router.push(it.href)} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group/btn ${it.disabled ? "opacity-30 cursor-not-allowed border border-slate-50" : "bg-white border border-slate-100 hover:border-[#FFCC00] shadow-sm"}`}>
                          <div className="flex items-center gap-2 overflow-hidden"><it.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-[10px] font-bold text-slate-600 truncate">{it.label}</span></div>
                          <ChevronRight className="w-3 h-3 text-slate-200 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            </section>

            {/* CONNECTED ACCOUNTS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Connected Accounts</h2>
                <div className="flex gap-2">
                  <button onClick={handleManualRefresh} className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-slate-800 transition-all"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
                  <button onClick={handleAddProject} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold shadow-md">+ Connect</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { platform: "Google Profile", iconImg: "/social-icon/gmb-icon.png", badge: `${summary.total} Locs`, stats: [{ l: "Views", v: "12.4K" }, { l: "Clicks", v: "1.2K" }] },
                  { platform: "Facebook", iconImg: "/social-icon/facebook-icon.png", badge: `${facebookPages.length} Pages`, stats: [{ l: "Followers", v: "5.2K" }, { l: "Engmt", v: "320" }] },
                  { platform: "Instagram", iconImg: "/social-icon/instagram-icon.png", badge: `${instagramPages.length} Acc`, stats: [{ l: "Followers", v: "3.8K" }, { l: "Engmt", v: "280" }] },
                  { platform: "WhatsApp", iconImg: "/social-icon/whatsaap-icon.png", badge: "0 Active", stats: [{ l: "Msgs", v: "0" }, { l: "Repls", v: "0" }] },
                  { platform: "LinkedIn", iconImg: "/social-icon/linkedin.png", badge: "0 Profs", stats: [{ l: "Conns", v: "0" }, { l: "Views", v: "0" }] },
                  { platform: "Pinterest", iconImg: "/social-icon/pinterest-icon.png", badge: "0 Boards", stats: [{ l: "Pins", v: "0" }, { l: "Saves", v: "0" }] },
                ].map((acc, i) => (
                  <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4 hover:border-[#FFCC00]/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-50">
                          <img src={acc.iconImg} alt={acc.platform} className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />
                        </div>
                        <div className="min-w-0"><h4 className="text-[11px] font-bold text-slate-800 truncate leading-tight">{acc.platform}</h4><p className={`text-[8px] font-bold uppercase ${i < 3 ? "text-green-500" : "text-slate-300"}`}>{i < 3 ? "Linked" : "Upcoming"}</p></div>
                      </div>
                      <span className="text-[8px] bg-slate-50 px-2 py-0.5 rounded-md font-bold text-slate-400 border border-slate-100">{acc.badge}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {acc.stats.map((s, k) => (
                        <div key={k} className="p-2 bg-slate-50/50 rounded-lg border border-slate-50">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{s.l}</p>
                          <p className="text-xs font-black text-slate-800">{s.v}</p>
                          <p className="text-[8px] text-green-500 font-bold flex items-center gap-0.5"><TrendingUp size={8} /> 0%</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button onClick={() => i===0 ? setUiState(p => ({...p, showLocationSelectorModal: true})) : router.push("/post-management")} className="py-2 bg-white border border-slate-100 hover:border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-500 transition-all">Insights</button>
                      <button onClick={() => router.push("/post-management")} className="py-2 bg-[#FFCC00] hover:bg-[#FFD700] rounded-lg text-[9px] font-black uppercase text-black transition-all">Post</button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleAddProject} className="w-full py-8 rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-white/40 hover:bg-white hover:border-[#FFCC00]/50 transition-all group">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#FFCC00] transition-colors border border-slate-50">
                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-black" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Connect Another Account</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Manage all your social platforms from a single hub</p>
                </div>
              </button>
            </section>
          </div>

          {/* SIDEBAR: ACTIVITY */}
          <div className="w-full xl:w-72 shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 uppercase text-xs">Activity</h3>
                <button onClick={() => router.push("/user-activity")} className="text-[9px] font-black text-purple-600 uppercase tracking-widest">View All</button>
              </div>
              <div className="space-y-6">
                {[
                  { action: "Post published", time: "2m ago", iconImg: "/social-icon/instagram-icon.png", bg: "bg-pink-50" },
                  { action: "Review replied", time: "15m ago", iconImg: "/social-icon/gmb-icon.png", bg: "bg-blue-50" },
                  { action: "Post scheduled", time: "1h ago", iconImg: "/social-icon/facebook-icon.png", bg: "bg-blue-50" },
                  { action: "Metric update", time: "3h ago", iconImg: "/social-icon/gmb-icon.png", bg: "bg-slate-50" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-50`}>
                         <img src={item.iconImg} alt="icon" className="w-4.5 h-4.5 object-contain" />
                      </div>
                      <div className="min-w-0"><p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{item.action}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{item.time}</p></div>
                    </div>
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FEF2F2] p-6 rounded-[1.5rem] border border-red-50 space-y-3">
              <div className="flex items-center gap-2"><h3 className="font-black text-red-700 uppercase text-xs">Pro Tip</h3><Lightbulb className="w-3.5 h-3.5 text-yellow-500" /></div>
              <p className="text-[10px] font-medium text-slate-600 leading-relaxed">Connect more accounts to track everything in one place.</p>
              <button onClick={handleAddProject} className="w-full py-2.5 bg-white border border-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Connect Now</button>
            </div>
          </div>

        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
}
