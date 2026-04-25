"use client";
import React, { useCallback } from "react";
import { Activity, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

import { useAuditHealth } from "@/hooks/useAuditHealth";
import GBPAuditCard from "@/components/gmb-health/GBPAuditCard";
// import SupportModal from "@/components/SupportModal";
import AuditSelector from "@/components/gmb-health/AuditSelector";
import LoadingScanner from "@/components/gmb-health/LoadingScanner";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function AuditPage() {
  const {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    loading,
    auditData,
    handleGenerateReport
  } = useAuditHealth();

  const handleShowToast = useCallback((message, type) => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  }, []);

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
                  Business <span className="text-lemon-hover">Health</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Check Your Profile Strength</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Live Check Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        <AuditSelector
          locations={locations}
          selectedLocationId={selectedLocationId}
          setSelectedLocationId={setSelectedLocationId}
          loading={loading}
          handleGenerateReport={handleGenerateReport}
        />

        {/* Results Section */}
        {auditData && (
          <div className="animate-fadeIn mb-10">
            <GBPAuditCard audit={auditData} />
          </div>
        )}

        {loading && <LoadingScanner />}

        {!auditData && !loading && (
          <div className="text-center py-12">
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 sm:p-16 max-w-lg mx-auto shadow-sm hover:shadow-xl transition-all">
              <div className="bg-lemon-glow/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-lemon-glow/20">
                <Activity className="w-8 h-8 text-lemon-hover" />
              </div>
              <h3 className="text-sm font-black text-black uppercase tracking-tight mb-3" style={{ fontFamily: "var(--font-heading)" }}>Ready to Check</h3>
              <p className="text-slate-400 font-bold text-[10px] leading-relaxed mb-8 px-4">
                Select your business from the list above to get a full report on how well you are doing online.
              </p>
              <button
                onClick={handleGenerateReport}
                className="btn-lemon px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
              >
                Start Check ↗
              </button>
            </div>
          </div>
        )}
      </div>

      {/* <SupportModal showToast={handleShowToast} /> */}
        <WhatsAppButton />

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