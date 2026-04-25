import React from "react";
import { QrCode, Share2, Download, Printer } from "lucide-react";
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
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-black/5 p-4 sm:p-10 relative transition-all hover:shadow-2xl w-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 bg-black rounded-xl shadow-lg shrink-0">
            <QrCode className="text-[#EAB308] w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Your QR Code
            </h3>
            <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              Customer Review Page
            </p>
          </div>
        </div>
        <button
          onClick={shareLink}
          title="Share Link"
          className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all shrink-0"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
        </button>
      </div>

      {/* QR Card Wrapper — fully centered, never overflows */}
      <div className="w-full flex justify-center mb-6 sm:mb-10">
        <div
          ref={qrCardRef}
          className="relative rounded-[1.5rem] sm:rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-100"
          style={{ width: "min(260px, 100%)" }}
        >
          {/* Google Color Corner Backgrounds */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-400 rounded-br-[80px]" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500 rounded-bl-[80px]" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-500 rounded-tr-[80px]" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tl-[80px]" />
          </div>

          {/* White Inner Card */}
          <div className="relative bg-white m-2 sm:m-4 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center shadow-sm">

            {/* Google Logo */}
            <div className="flex justify-center mb-1 sm:mb-2">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tighter leading-none">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
              </span>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-0.5 sm:gap-1 text-yellow-400 mb-1 sm:mb-2 text-base sm:text-xl">
              ★ ★ ★ ★ ★
            </div>

            {/* Subheading */}
            <p className="text-[10px] sm:text-sm font-semibold text-gray-700">
              Scan to Rate Us on{" "}
              <span className="font-bold text-black">Google</span>
            </p>

            {/* Business Name */}
            <h3 className="text-xs sm:text-base font-bold text-gray-900 mt-1 sm:mt-2 mb-2 sm:mb-4 line-clamp-2 leading-tight px-1 break-words">
              {business}
            </h3>

            {/* QR Code Image */}
            {qrImage && (
              <div
                className="relative mx-auto bg-white p-1.5 sm:p-3 rounded-xl shadow-md border border-slate-100"
                style={{ width: "min(150px, 75%)" }}
              >
                <img
                  src={qrImage}
                  alt="Google Review QR"
                  className="w-full h-auto aspect-square block object-contain"
                />
                {/* Corner Accents */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500 rounded-tl-md" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500 rounded-tr-md" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400 rounded-bl-md" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-500 rounded-br-md" />
              </div>
            )}

            {/* Review URL */}
            {reviewUrl && (
              <p className="text-[9px] text-gray-400 mt-3 break-all px-1 line-clamp-2">
                {reviewUrl}
              </p>
            )}

            {/* Footer */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium shrink-0">
                Powered by
              </p>
              <div className="w-4 h-4 sm:w-5 sm:h-5 relative shrink-0">
                <Image
                  src="/images/bg-logo.png"
                  alt="LimbuAI"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-900 tracking-tight shrink-0">
                LimbuAI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => downloadQR(qrCardRef.current)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#EAB308] text-black hover:bg-[#FACC15] transition-colors shadow-md"
        >
          <Download size={14} /> Save Image
        </button>
        <button
          onClick={() => printQR(qrCardRef.current)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <Printer size={14} /> Print Now
        </button>
      </div>
    </div>
  );
}