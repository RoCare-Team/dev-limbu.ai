import React from "react";
import { QrCode, Share2, Star, Sparkles, Download, Printer } from "lucide-react";
import Image from "next/image";

export default function QRPreviewCard({
  business,
  qrImage,
  shareLink,
  downloadQR,
  printQR,
  qrCardRef,
  reviewUrl
}) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10 relative overflow-hidden transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-black rounded-xl shadow-lg">
            <QrCode className="text-[#EAB308] w-5 h-5" />
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
        <div ref={qrCardRef} className="relative w-[340px] rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-100">

          {/* Google Color Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-400 rounded-br-[120px]" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500 rounded-bl-[120px]" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-500 rounded-tr-[120px]" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tl-[120px]" />
          </div>

          {/* White Card */}
          <div className="relative bg-white m-4 rounded-2xl p-6 text-center shadow-sm">

            {/* Google Logo */}
            <div className="flex justify-center mb-2">
              <span className="text-4xl font-extrabold tracking-tighter">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </span>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-1 text-yellow-400 mb-2 text-xl">
              ★ ★ ★ ★ ★
            </div>

            {/* Heading */}
            <p className="text-sm font-semibold text-gray-700">
              Scan to Rate Us on <span className="font-bold text-black">Google</span>
            </p>

            {/* Business Name */}
            <h3 className="text-base font-bold text-gray-900 mt-2 mb-4 line-clamp-2 leading-tight">
              {business}
            </h3>

            {/* QR Code Box */}
            {qrImage && (
              <div className="relative inline-block bg-white p-4 rounded-xl shadow-md border border-slate-50">
                <img
                  src={qrImage}
                  alt="Google Review QR"
                  className="w-48 h-48 mx-auto"
                />

                {/* Corner Accents */}
                <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              </div>
            )}

            {/* Review URL (Optional) */}
            {reviewUrl && (
              <p className="text-[10px] text-gray-400 mt-4 break-all px-2 line-clamp-2">
                {reviewUrl}
              </p>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
              <p className="text-[10px] text-gray-500 font-medium">Powered by</p>

              <div className="w-5 h-5 relative">
                <Image
                  src="/images/bg-logo.png" // 👈 apna image public folder me daal (public/lemon.png)
                  alt="LimbuAI"
                  fill
                  className="object-contain"
                />
              </div>

              <p className="text-xs font-bold text-slate-900 tracking-tight">LimbuAI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => downloadQR(qrCardRef.current)} className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#EAB308] text-black hover:bg-[#FACC15] transition-colors shadow-md">
          <Download size={14} /> Save Image
        </button>
        <button onClick={() => printQR(qrCardRef.current)} className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          <Printer size={14} /> Print Now
        </button>
      </div>
    </div>
  );
}