import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader, Check, Copy, Server } from "lucide-react";

export default function DesignHeader({ isSaving, isSaved, copyPayload, forceSync }) {
  const [copiedPayload, setCopiedPayload] = useState(false);

  const handleCopy = () => {
    copyPayload();
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2.5 rounded-2xl border border-black/10 hover:bg-slate-50 transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight leading-none mb-1 font-heading">
                Asset <span className="text-lemon-hover">Management</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Creative Resource Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSaving && <Loader className="w-4 h-4 animate-spin text-lemon-hover" />}
            {isSaved && (
              <span className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button onClick={handleCopy} className="btn-ghost px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 border border-black/10">
              {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Settings
            </button>
            <button onClick={forceSync} className="btn-lemon px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg">
              <Server className="w-4 h-4" /> Force Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}