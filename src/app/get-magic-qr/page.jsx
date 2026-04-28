"use client";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, QrCode, Share2, Download, Printer, MessageSquare, Star, Check, Copy, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import { useMagicQR } from "@/hooks/useMagicQR";
import Select from "react-select";
import LogicDemoModal from "@/components/magic-qr/LogicDemoModal";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function BusinessQR() {
  const {
    isMounted,
    allLocations,
    selectedLocationId,
    business,
    reviewUrl,
    qrImage,
    copied,
    handleLocationChange,
    copyToClipboard,
    shareLink,
    downloadQR,
    printQR
  } = useMagicQR();

  const [showDemo, setShowDemo] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const qrCardRef = useRef(null);

  if (!isMounted) return null;

  // Format locations for react-select
  const locationOptions = allLocations.map((loc) => {
    const title = loc.title || "";
    const locality = loc.storefrontAddress?.locality || loc.locality || "";
    const label = locality ? `${title} - ${locality}` : title;
    return { value: loc.locationId, label };
  });

  const selectedOption = locationOptions.find((opt) => opt.value === selectedLocationId) || null;

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: state.isFocused ? "var(--lemon-glow)" : "rgba(0, 0, 0, 0.05)",
      boxShadow: state.isFocused ? "0 0 0 2px var(--lemon-glow)" : "none",
      borderRadius: "0.75rem",
      padding: "0.2rem",
      fontSize: "0.75rem",
      fontWeight: "700",
      color: "black",
      transition: "all 0.2s ease",
      cursor: "pointer",
      "&:hover": { borderColor: "var(--lemon-glow)" },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "var(--lemon-glow)" : state.isFocused ? "rgba(250, 204, 21, 0.1)" : "white",
      color: "black",
      fontSize: "0.75rem",
      fontWeight: "600",
      cursor: "pointer",
      "&:active": { backgroundColor: "var(--lemon-hover)" },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      overflow: "hidden",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      zIndex: 50,
    }),
    singleValue: (provided) => ({ ...provided, color: "black" }),
    placeholder: (provided) => ({
      ...provided,
      color: "rgba(0, 0, 0, 0.3)",
      fontSize: "0.75rem",
      fontWeight: "600",
    }),
    input: (provided) => ({ ...provided, color: "black", margin: "0px" }),
    indicatorSeparator: () => ({ display: "none" }),
  };

  // ── No Business State ──
  if (!business) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        <div className="bg-white border border-black/5 rounded-[2rem] p-10 text-center max-w-lg mx-auto shadow-2xl relative z-10 transition-all hover:shadow-lemon">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5">
            <QrCode className="w-8 h-8 text-slate-200" />
          </div>
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            No Business Found
          </h2>
          <p className="text-slate-500 font-medium mb-8 text-xs leading-relaxed">
            Please connect your Google Business Profile first to create your Magic QR code.
          </p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="w-full btn-lemon px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
          >
            Go to Dashboard <ArrowRight className="inline-block w-3 h-3 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />

      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Ambient Glows */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{ background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{ background: "radial-gradient(ellipse at bottom left, rgba(250, 204, 21, 0.2) 0%, transparent 65%)" }}
      />

      {/* ── Page Header ── */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Magic <span className="text-lemon-hover">QR</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Review Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 py-10 sm:py-16">

        {/* Business Name + Location Switcher */}
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {business}
          </h2>
          {allLocations.length > 1 && (
            <div className="max-w-xs mx-auto mt-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Change Location</label>
              <Select
                value={menuIsOpen ? null : selectedOption}
                onChange={(option) => {
                  handleLocationChange(option.value);
                  setMenuIsOpen(false);
                }}
                onMenuOpen={() => setMenuIsOpen(true)}
                onMenuClose={() => setMenuIsOpen(false)}
                options={locationOptions}
                styles={customStyles}
                placeholder="search location"
                isSearchable={true}
                blurInputOnSelect={true}
                menuPlacement="auto"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* ══════════════════════════════════════
    QR PREVIEW CARD (FIXED CENTERING)
══════════════════════════════════════ */}
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10 transition-all hover:shadow-2xl w-full flex flex-col items-center">

            {/* Card Header - Now aligned with the card below */}
            <div className="flex items-center justify-between mb-8 w-full">
              <div className="flex items-center gap-3">
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

            {/* QR Card Container - Forced Centering */}
            <div className="w-full flex justify-center items-center mb-8 sm:mb-10 overflow-visible">
              <div
                ref={qrCardRef}
                className="relative rounded-[1.5rem] sm:rounded-3xl shadow-2xl bg-white border border-slate-100 overflow-hidden w-full max-w-[260px]"
                
              >
                {/* Google Color Corner Backgrounds */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-400 rounded-br-[80px] opacity-90" />
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500 rounded-bl-[80px] opacity-90" />
                  <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-500 rounded-tr-[80px] opacity-90" />
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tl-[80px] opacity-90" />
                </div>

                {/* White Inner Card */}
                <div className="relative z-10 bg-white m-2 sm:m-3 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-sm flex flex-col items-center">

                  {/* Google Logo */}
                  <div className="flex justify-center mb-1">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter leading-none select-none">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">o</span>
                      <span className="text-yellow-500">o</span>
                      <span className="text-blue-500">g</span>
                      <span className="text-green-500">l</span>
                      <span className="text-red-500">e</span>
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center gap-0.5 text-yellow-400 mb-2 text-base sm:text-lg">
                    ★ ★ ★ ★ ★
                  </div>

                  <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">
                    Scan to Rate Us on <span className="font-bold text-black">Google</span>
                  </p>

                  {/* Business Name - Center aligned & wrapping */}
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-4 line-clamp-2 leading-tight px-2 w-full break-words">
                    {business}
                  </h3>

                  {/* QR Code Image Container */}
                  {qrImage && (
                    <div className="relative mx-auto bg-white p-2 rounded-xl shadow-md border border-slate-100 w-32 sm:w-40 aspect-square flex items-center justify-center">
                      <img
                        src={qrImage}
                        alt="Google Review QR"
                        crossOrigin="anonymous"
                        className="w-full h-full block object-contain"
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
                    <p className="text-[8px] text-gray-400 mt-4 break-all px-2 line-clamp-1 w-full">
                      {reviewUrl}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 w-full">
                    <p className="text-[9px] text-gray-500 font-medium">Powered by</p>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/bg-logo.png" alt="LimbuAI" fill className="object-contain" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-900 tracking-tight">LimbuAI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Centered below card */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] mx-auto sm:max-w-none">
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

          {/* ══════════════════════════════════════
              QR LOGIC PANEL
          ══════════════════════════════════════ */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10">

              {/* Panel Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-lemon-glow rounded-xl shrink-0">
                    <MessageSquare className="text-black w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      Review Filter
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Protection</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDemo(true)}
                  className="text-[9px] font-black text-lemon-hover uppercase tracking-widest hover:underline shrink-0"
                >
                  How this works?
                </button>
              </div>

              {/* Filter Cards */}
              <div className="space-y-3 mb-8">
                {/* Low Rating — Private */}
                <div className="group bg-slate-50 border border-black/5 p-4 rounded-xl transition-all hover:bg-black">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => (
                        <Star key={i} size={12} className="text-lemon-hover group-hover:text-lemon-glow" fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[8px] font-black bg-white/10 text-slate-400 group-hover:text-lemon-glow px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Private
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 leading-relaxed">
                    Unhappy customers can message you privately, so your public Google rating stays safe.
                  </p>
                </div>

                {/* High Rating — Public */}
                <div className="group bg-lemon-glow/5 border border-lemon-glow/10 p-4 rounded-xl transition-all hover:bg-lemon-glow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={12} className="text-lemon-hover group-hover:text-black" fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[8px] font-black bg-black/5 text-lemon-hover group-hover:text-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Public
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-lemon-hover group-hover:text-black leading-relaxed">
                    Happy customers are automatically sent to your Google page to leave a 5-star review.
                  </p>
                </div>
              </div>

              {/* Review Link Section */}
              <div className="pt-6 border-t border-black/5 space-y-4">
                <div className="flex items-center gap-3">
                  <Share2 size={14} className="text-black shrink-0" />
                  <span className="text-[9px] font-black text-black uppercase tracking-widest">Your Review Link</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-black/5">
                  <code className="flex-1 text-[9px] font-bold text-slate-400 truncate px-2">{reviewUrl}</code>
                  <button
                    onClick={copyToClipboard}
                    title="Copy Link"
                    className={`p-2 rounded-lg transition-all shrink-0 ${copied ? "bg-green-500 text-white" : "bg-white hover:bg-lemon-glow hover:text-black border border-black/5"}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={shareLink}
                  className="w-full btn-lemon py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                >
                  Send Link to Customers ↗
                </button>
              </div>
            </div>

            {/* Quick Tip Box */}
            <div className="bg-black rounded-3xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-2 bg-lemon-glow rounded-lg shrink-0">
                  <Zap size={14} className="text-black fill-black" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Quick Tip</h4>
                  <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                    Show this QR code to your customers after their purchase to get more 5-star reviews!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showDemo && <LogicDemoModal setShowDemo={setShowDemo} />}
      <WhatsAppButton />
    </div>
  );
}