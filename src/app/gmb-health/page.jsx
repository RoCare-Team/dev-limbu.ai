"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import GBPAuditCard from "@/components/GBPAuditCard";
import { Loader2, Search, MapPin, BarChart3, Sparkles, Activity, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";
import Link from "next/link";

export default function AuditPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const loadingMessages = [
    "Establishing GMB Connection...",
    "Retrieving Local Data...",
    "Analyzing Sentiment Patterns...",
    "Scanning SEO Velocity...",
    "Compiling Intelligence Report..."
  ];

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  useEffect(() => {
    // Load locations from localStorage
    const storedLocations = localStorage.getItem("locationDetails");
    if (storedLocations) {
      try {
        const parsed = JSON.parse(storedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed);
          setSelectedLocationId(parsed[0].locationId);
        }
      } catch (e) {
        console.error("Failed to parse locations", e);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateReport = async () => {
    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to generate report");
      return;
    }

    const selectedLoc = locations.find((l) => l.locationId === selectedLocationId);
    if (!selectedLoc) {
      toast.error("Location details not found");
      return;
    }

    setLoading(true);
    setAuditData(null);
    setLoadingMsgIndex(0);

    try {
      const payload = [
        {
          location_id: selectedLoc.locationId,
          account_id: selectedLoc.accountId,
          token: session.accessToken,
        },
      ];

      const res = await fetch(
        "https://n8n.limbutech.in/webhook/10d9cd54-46a7-4c3b-9c61-0ce9cf666eac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch audit data");

      const data = await res.json();
      
      let audit = data;
      if (Array.isArray(data) && data.length > 0) {
        audit = data[0];
      }
      
      if (audit && typeof audit === 'object' && "" in audit) {
        audit = audit[""];
      }

      setAuditData(audit);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Audit Error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />
      
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  GMB <span className="text-lemon-hover">Health</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Asset Audit & Optimization</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Real-time Diagnostic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Selection Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 mb-8 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Active Business Node
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-300 group-focus-within:text-lemon-hover transition-colors" />
                </div>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-black/5 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                  disabled={loading || locations.length === 0}
                >
                  {locations.length === 0 ? (
                    <option>No sectors detected</option>
                  ) : (
                    locations.map((loc) => (
                      <option key={loc.locationId} value={loc.locationId}>
                        {loc.title} {loc.locality ? `— ${loc.locality}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading || locations.length === 0}
              className="btn-lemon w-full md:w-auto px-8 py-3 rounded-xl shadow-lg hover:scale-[1.02] disabled:opacity-50 text-[10px] font-black uppercase tracking-widest gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Diagnostic ↗
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {auditData && (
          <div className="animate-fadeIn mb-10">
            <GBPAuditCard audit={auditData} />
          </div>
        )}
        
        {loading && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-black/5 p-10 sm:p-16 flex flex-col items-center justify-center min-h-[400px] animate-fadeIn mb-10 relative overflow-hidden">
            
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-lemon-glow/20" />
            
            {/* Scanning Animation */}
            <div className="relative w-24 h-32 bg-slate-50 rounded-xl border border-black/5 mb-8 overflow-hidden flex flex-col gap-2 p-3 shadow-inner">
              <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
              <div className="h-1.5 w-full bg-slate-200 rounded-full" />
              <div className="h-1.5 w-5/6 bg-slate-200 rounded-full" />
              <div className="h-1.5 w-full bg-slate-200 rounded-full" />
              <div className="h-12 w-full bg-white rounded-lg mt-2 border border-black/5 border-dashed flex items-center justify-center">
                 <Activity className="w-5 h-5 text-slate-100" />
              </div>

              {/* Scanning Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-lemon-hover shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-scan-vertical" />
            </div>
            
            <div className="text-center space-y-3 max-w-sm">
              <h3 className="text-sm font-black text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {loadingMessages[loadingMsgIndex]}
              </h3>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-relaxed">
                Our AI engine is currently auditing over 50+ performance metrics and local search signals.
              </p>
              
              {/* Progress Bar */}
              <div className="w-48 h-1 bg-slate-100 rounded-full mt-6 overflow-hidden mx-auto border border-black/5">
                 <div className="h-full bg-lemon-hover rounded-full animate-progress-indeterminate shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
              </div>
            </div>
          </div>
        )}

        {!auditData && !loading && (
          <div className="text-center py-12">
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 sm:p-16 max-w-lg mx-auto shadow-sm hover:shadow-xl transition-all">
              <div className="bg-lemon-glow/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-lemon-glow/20">
                <Activity className="w-8 h-8 text-lemon-hover" />
              </div>
              <h3 className="text-sm font-black text-black uppercase tracking-tight mb-3" style={{ fontFamily: "var(--font-heading)" }}>Ready for Audit</h3>
              <p className="text-slate-400 font-bold text-[10px] leading-relaxed mb-8 px-4">
                Select your target location from the node selector above to generate a comprehensive GBP health report.
              </p>
              <button
                onClick={handleGenerateReport}
                className="btn-lemon px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
              >
                Initialize Scan ↗
              </button>
            </div>
          </div>
        )}
      </div>

      <SupportModal showToast={showToast} />
      
      <style jsx>{`
        @keyframes scan-vertical {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-vertical {
          animation: scan-vertical 2s linear infinite;
        }
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
