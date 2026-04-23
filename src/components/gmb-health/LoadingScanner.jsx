import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";

const loadingMessages = [
  "Connecting to Google...",
  "Gathering your business details...",
  "Reading customer reviews...",
  "Checking how you rank...",
  "Creating your health report..."
];

const LoadingScanner = React.memo(() => {
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
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
          Our system is checking your profile against 50+ key success factors.
        </p>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-slate-100 rounded-full mt-6 overflow-hidden mx-auto border border-black/5">
          <div className="h-full bg-lemon-hover rounded-full animate-progress-indeterminate shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
        </div>
      </div>
    </div>
  );
});

LoadingScanner.displayName = "LoadingScanner";
export default LoadingScanner;