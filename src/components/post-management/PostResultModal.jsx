import React from "react";
import { X, CheckCircle, XCircle, RefreshCw, MapPin, Info } from "lucide-react";

const PostResultModal = ({ isOpen, onClose, successLocs, failedLocs, onRepost, isReposting, isVideo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-white border border-black/[0.03] rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 flex items-center justify-between z-10 border-b border-black/5">
          <div>
            <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">Post Summary</p>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight font-heading">
              Publication Results
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 border border-black/5 rounded-2xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scroll">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><CheckCircle size={24} /></div>
              <div>
                <p className="text-2xl font-black text-emerald-700">{successLocs.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Successful</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600"><XCircle size={24} /></div>
              <div>
                <p className="text-2xl font-black text-red-700">{failedLocs.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Failed</p>
              </div>
            </div>
          </div>
          
          {isVideo && successLocs.length > 0 && (
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
               <Info className="w-5 h-5 text-blue-500 mt-0.5" />
               <div>
                 <p className="text-sm font-bold text-blue-800">Video Processing</p>
                 <p className="text-xs text-blue-600/80 mt-1">Your video has been successfully queued for publication. It may take up to 5 minutes to reflect on your Google Business Profile.</p>
               </div>
             </div>
          )}

          {/* Lists */}
          <div className="space-y-4">
            {failedLocs.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] ml-2 mb-2">Failed Locations</p>
                <div className="space-y-2">
                  {failedLocs.map(loc => (
                    <div key={loc.id} className="p-4 rounded-2xl border border-red-100 bg-red-50/50 flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm uppercase tracking-tight">{loc.title || loc.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {loc.locality || loc.city || loc.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {successLocs.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-2 mb-2 mt-4">Successful Locations</p>
                <div className="space-y-2">
                  {successLocs.map(loc => (
                    <div key={loc.id} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center gap-3 opacity-70">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm uppercase tracking-tight">{loc.title || loc.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {loc.locality || loc.city || loc.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-black/5 flex gap-4">
          {failedLocs.length > 0 && (
            <button
              onClick={onRepost}
              disabled={isReposting}
              className="flex-[2] bg-black text-white px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-lemon-glow hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isReposting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isReposting ? "Retrying..." : "Retry Failed Posts"}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-black/10 text-black px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostResultModal;
