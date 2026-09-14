"use client";

import { Download, Loader2, Share2 } from "lucide-react";

/**
 * A generated video that has no Post yet (made before posting existed, or its Post
 * was deleted). Shows the same Approve / Reject as a pending PostCard; clicking
 * creates the Post, after which the page renders a full PostCard in its place.
 */
export default function UnlinkedVideoCard({
  item,
  title,
  subtitle,
  onApprove,
  onReject,
  busy = false,
  onDownload,
  onShare,
}) {
  const createdLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "";
  // Rows that never reached the database can't get a Post.
  const canAct = !!item._id && !String(item._id).startsWith("local-");

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-56 sm:h-64 bg-black group">
        <video src={item.videoUrl} className="w-full h-full object-contain bg-black" controls />
        {createdLabel && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full border border-white/70 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm pointer-events-none">
            {createdLabel}
          </div>
        )}
        {(onDownload || onShare) && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(item.videoUrl)}
                title="Download"
                className="p-2.5 bg-white/90 backdrop-blur text-black rounded-xl shadow-lg hover:bg-[#EAB308] transition-all"
              >
                <Download size={15} />
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={() => onShare(item.videoUrl)}
                title="Share"
                className="p-2.5 bg-white/90 backdrop-blur text-black rounded-xl shadow-lg hover:bg-[#EAB308] transition-all"
              >
                <Share2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Same buttons as a pending PostCard in /post-management */}
        <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-black/5">
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => onApprove(item)}
            className="py-4 bg-[#EAB308] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#EAB308]/10 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            Approve
          </button>
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => onReject(item)}
            className="py-4 border border-black/5 text-black/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
        {!canAct && (
          <p className="text-[10px] text-slate-400 text-center -mt-1">
            Ye video save nahi ho payi thi, isliye post nahi ho sakti.
          </p>
        )}
      </div>
    </div>
  );
}
