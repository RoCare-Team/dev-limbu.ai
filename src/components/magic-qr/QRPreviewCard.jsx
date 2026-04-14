import React from "react";
import { QrCode, Share2, Star, Sparkles, Download, Printer } from "lucide-react";

export default function QRPreviewCard({ 
  business, 
  qrImage, 
  shareLink, 
  downloadQR, 
  printQR, 
  qrCardRef 
}) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10 relative overflow-hidden transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-black rounded-xl shadow-lg">
            <QrCode className="text-lemon-glow w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Your QR Code</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Customer Review Page</p>
          </div>
        </div>
        <button 
          onClick={shareLink}
          title="Share Link"
          className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all"
        >
          <Share2 className="w-4 h-4 text-black" />
        </button>
      </div>

      <div className="flex justify-center mb-10">
        <div ref={qrCardRef} className="relative w-[300px] bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-black/5">
          <div className="absolute inset-0 p-[2px] bg-gradient-to-br from-blue-500 via-red-500 via-yellow-400 to-green-500">
            <div className="absolute inset-0 bg-white m-[2px] rounded-[1.9rem]" />
          </div>

          <div className="relative p-6 text-center">
            <div className="flex justify-center mb-3">
              <span className="text-2xl font-black tracking-tighter">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </span>
            </div>

            <div className="flex justify-center gap-1 text-yellow-400 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
            </div>

            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Scan to Rate Us</p>
            <h4 className="text-xs font-black text-black uppercase tracking-tight mb-6 line-clamp-1">{business}</h4>

            {qrImage && (
              <div className="relative inline-block bg-white p-4 rounded-2xl shadow-inner border border-slate-50 mb-6">
                <img src={qrImage} alt="Review QR Code" className="w-40 h-40" />
                <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-black rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-black rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-black rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-black rounded-br-lg" />
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Created with</p>
              <div className="flex items-center gap-1">
                 <div className="w-4 h-4 bg-black rounded flex items-center justify-center">
                   <Sparkles size={8} className="text-lemon-glow" />
                 </div>
                 <span className="text-[8px] font-black text-black tracking-tighter">Limbu AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => downloadQR(qrCardRef.current)} className="btn-lemon py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2">
          <Download size={14} /> Save Image
        </button>
        <button onClick={() => printQR(qrCardRef.current)} className="btn-ghost py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2">
          <Printer size={14} /> Print Now
        </button>
      </div>
    </div>
  );
}