"use client";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";
import { useMagicQR } from "@/hooks/useMagicQR";
import Select from "react-select";

// Sub-components
import QRPreviewCard from "@/components/magic-qr/QRPreviewCard";
import QRLogicPanel from "@/components/magic-qr/QRLogicPanel";
import LogicDemoModal from "@/components/magic-qr/LogicDemoModal";

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
  const qrCardRef = useRef(null);

  const showToast = (message, type) => {
    if (type === "error") toast.error(message);
    else if (type === "success") toast.success(message);
    else toast(message);
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch on initial render
  }

  // Format locations for react-select
  const locationOptions = allLocations.map((loc) => {
    const title = loc.title || "";
    const locality = loc.storefrontAddress?.locality || loc.locality || "";
    const label = locality ? `${title} - ${locality}` : title;
    return { value: loc.locationId, label };
  });

  const selectedOption = locationOptions.find((opt) => opt.value === selectedLocationId) || null;

  // Custom styles for react-select to match the design system
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: state.isFocused ? "var(--lemon-glow)" : "rgba(0, 0, 0, 0.05)",
      boxShadow: state.isFocused ? "0 0 0 2px var(--lemon-glow)" : "none",
      borderRadius: "0.75rem", // rounded-xl
      padding: "0.2rem",
      fontSize: "0.75rem", // text-xs
      fontWeight: "700", // font-bold
      color: "black",
      transition: "all 0.2s ease",
      cursor: "pointer",
      "&:hover": {
        borderColor: "var(--lemon-glow)",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? "var(--lemon-glow)" 
        : state.isFocused 
          ? "rgba(250, 204, 21, 0.1)" 
          : "white",
      color: state.isSelected ? "black" : "black",
      fontSize: "0.75rem",
      fontWeight: "600",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "var(--lemon-hover)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.75rem",
      overflow: "hidden",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      zIndex: 50,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "black",
    }),
    input: (provided) => ({
      ...provided,
      color: "black",
      margin: "0px",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
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
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(250, 204, 21, 0.2) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Switch Active Business */}
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {business}
          </h2>
          
          {allLocations.length > 1 && (
            <div className="max-w-xs mx-auto mt-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Change Location</label>
              <Select
                value={selectedOption}
                onChange={(option) => handleLocationChange(option.value)}
                options={locationOptions}
                styles={customStyles}
                placeholder="Search locations..."
                isSearchable={true}
                blurInputOnSelect={true}
                menuPlacement="auto"
              />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <QRPreviewCard 
            business={business}
            qrImage={qrImage}
            shareLink={shareLink}
            downloadQR={downloadQR}
            printQR={printQR}
            qrCardRef={qrCardRef}
          />
          <QRLogicPanel 
            reviewUrl={reviewUrl}
            copied={copied}
            copyToClipboard={copyToClipboard}
            shareLink={shareLink}
            setShowDemo={setShowDemo}
          />
        </div>
      </div>

      {showDemo && <LogicDemoModal setShowDemo={setShowDemo} />}

      <SupportModal showToast={showToast} />
    </div>
  );
}