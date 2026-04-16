"use client";

import React from "react";
import { Check, MapPin, Facebook, Instagram, Calendar, Sparkles } from "lucide-react";

const ScheduleConfirmationModal = React.memo(({
  isOpen,
  onClose,
  scheduledPlatforms
}) => {
  if (!isOpen) return null;

  const hasGMB = scheduledPlatforms.gmb && scheduledPlatforms.gmb.length > 0;
  const hasFB = scheduledPlatforms.fb && scheduledPlatforms.fb.length > 0;
  const hasIG = scheduledPlatforms.ig && scheduledPlatforms.ig.length > 0;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Background Element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-amber-50 to-orange-50 -z-10 opacity-50" />

        {/* Success Icon Section */}
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-6">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-[#EAB308]/10 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-[#EAB308] flex items-center justify-center shadow-lg shadow-[#EAB308]/30">
                <Check className="w-8 h-8 text-black stroke-[3]" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-[#EAB308] animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans uppercase">
            Post <span className="text-[#EAB308]">Scheduled!</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
            Your creative journey is set. We'll handle the publishing at your selected time.
          </p>
        </div>

        {/* Platform Breakdown */}
        <div className="px-8 py-2 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Scheduled Destinations</p>
          
          <div className="grid gap-2">
            {hasGMB && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">Google Business</span>
                </div>
                <div className="bg-blue-100/50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">
                  {scheduledPlatforms.gmb.length} LOCS
                </div>
              </div>
            )}

            {hasFB && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 rounded-xl">
                    <Facebook className="w-4 h-4 text-blue-600 fill-current" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">Facebook</span>
                </div>
                <div className="bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">
                  {scheduledPlatforms.fb.length} PAGES
                </div>
              </div>
            )}

            {hasIG && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:border-pink-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-xl">
                    <Instagram className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">Instagram</span>
                </div>
                <div className="bg-pink-100/50 text-pink-700 px-3 py-1 rounded-full text-[10px] font-black">
                  {scheduledPlatforms.ig.length} ACCTS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8">
          <button
            onClick={onClose}
            className="group relative w-full overflow-hidden bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-800 active:scale-[0.98] shadow-xl shadow-slate-900/10"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
               Awesome, Got it!
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-tighter uppercase">View all in your scheduled tab</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ScheduleConfirmationModal.displayName = "ScheduleConfirmationModal";

export default ScheduleConfirmationModal;