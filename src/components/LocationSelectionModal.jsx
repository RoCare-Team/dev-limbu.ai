import React, { useState } from "react";
import { CheckCircle, MapPin, X, Info, Wallet, Zap, ShieldAlert } from "lucide-react";

const LocationSelectionModal = ({
  locations,
  onClose,
  onConfirm,
  title = "Select Locations",
  confirmText = "Confirm",
  initialSelected = [],
  walletBalance = 0,
}) => {
  const [selectedLocations, setSelectedLocations] = useState(initialSelected);
  const [checkmark, setCheckmark] = useState(["post", "photo"]);

  const handleCheckmarkChange = (option) => {
    setCheckmark((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  };

  const getPayload = () => {
    const hasPost = checkmark.includes("post");
    const hasPhoto = checkmark.includes("photo");
    if (hasPost && hasPhoto) return "both";
    if (hasPost) return "post";
    if (hasPhoto) return "photo";
    return "post";
  };

  const toggleLocation = (locationId) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId],
    );
  };

  const handleSelectAll = () => {
    const verifiedLocations = locations.filter((loc) => loc.isVerified);
    if (selectedLocations.length === verifiedLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(verifiedLocations.map((loc) => loc.id));
    }
  };

  const verifiedLocations = locations.filter((loc) => loc.isVerified);
  const unverifiedLocations = locations.filter((loc) => !loc.isVerified);

  const isPostAction = title.toLowerCase().includes("post");
  const totalCost = selectedLocations.length * 20;
  const insufficientFunds = isPostAction && walletBalance < totalCost;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-white border border-black/[0.03] rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* ── Background Aesthetics ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />

        {/* Modal Header */}
        <div className="relative px-8 pt-8 pb-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">Targeting Manager</p>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight font-heading">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 border border-black/5 rounded-2xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 relative z-10 custom-scroll">
          
          {/* Options & Action Type */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 border border-black/5 rounded-3xl">
            <div className="flex items-center gap-6">
              {["post", "photo"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checkmark.includes(opt)}
                    onChange={() => handleCheckmarkChange(opt)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-200 accent-lemon-glow transition-all"
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest text-black/70 group-hover:text-black">{opt}</span>
                </label>
              ))}
            </div>
            
            <button 
              onClick={handleSelectAll}
              className="text-[10px] font-black uppercase tracking-widest text-lemon-hover hover:underline"
            >
              {selectedLocations.length === verifiedLocations.length ? "Deselect All" : "Select All Verified"}
            </button>
          </div>

          {/* Summary Intelligence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-black/[0.05] p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl"><MapPin size={16} className="text-black/30" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Selection</p>
              </div>
              <p className="text-2xl font-black text-black">
                {selectedLocations.length} <span className="text-sm font-medium text-black/30 uppercase tracking-tighter">Locations</span>
              </p>
            </div>

            <div className="bg-white border border-black/[0.05] p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl"><Wallet size={16} className={`text-black/30 ${insufficientFunds ? "text-red-400" : ""}`} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Costing</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-black ${insufficientFunds ? "text-red-500" : "text-black"}`}>
                  {totalCost}
                </p>
                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Total Coins</p>
              </div>
            </div>
          </div>

          {/* Wallet Balance Alert */}
          {isPostAction && (
             <div className={`p-4 rounded-2xl border flex items-center justify-between ${insufficientFunds ? "bg-red-50 border-red-100" : "bg-lemon-glow/5 border-lemon-glow/20"}`}>
                <div className="flex items-center gap-3">
                  {insufficientFunds ? <ShieldAlert size={18} className="text-red-500" /> : <Zap size={18} className="text-lemon-hover" />}
                  <p className={`text-[11px] font-bold uppercase tracking-tight ${insufficientFunds ? "text-red-700" : "text-black/70"}`}>
                    {insufficientFunds ? `Need ${totalCost - walletBalance} more coins` : `Balance: ${walletBalance} Coins`}
                  </p>
                </div>
                {!insufficientFunds && <span className="text-[9px] font-black text-lemon-hover uppercase">Funds Clear</span>}
             </div>
          )}

          {/* Locations List */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] ml-2">Available Locations</p>
            <div className="space-y-2">
              {verifiedLocations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                    selectedLocations.includes(location.id)
                      ? "border-lemon-glow bg-lemon-glow/[0.03] shadow-md"
                      : "border-black/[0.03] bg-white hover:border-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedLocations.includes(location.id)
                            ? "bg-black border-black"
                            : "border-slate-200"
                        }`}
                      >
                        {selectedLocations.includes(location.id) && (
                          <CheckCircle className="w-4 h-4 text-lemon-glow" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm uppercase tracking-tight">
                          {location.title}
                        </p>
                        <p className="text-xs text-black/40 flex items-center gap-1 font-inter">
                          <MapPin className="w-3 h-3" />
                          {location.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-black/80">20</p>
                       <p className="text-[8px] font-black text-black/20 uppercase">Coins</p>
                    </div>
                  </div>
                </div>
              ))}

              {unverifiedLocations.length > 0 && (
                <div className="pt-6">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-3 ml-2">Unverified (Locked)</p>
                  {unverifiedLocations.map((location) => (
                    <div
                      key={location.id}
                      className="p-5 rounded-3xl border-2 border-dashed border-black/5 bg-slate-50 opacity-50 cursor-not-allowed mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                            <X className="w-3 h-3 text-slate-300" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-400 text-sm uppercase tracking-tight">
                              {location.name}
                            </p>
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {location.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative p-8 bg-slate-50 border-t border-black/5 z-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onConfirm(selectedLocations, getPayload())}
              disabled={selectedLocations.length === 0 || insufficientFunds}
              className="flex-[2] bg-black text-white px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-lemon-glow hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-black/5"
            >
              {insufficientFunds
                ? "Recharge Required"
                : `${confirmText} Post`}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-black/10 text-black px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
          </div>
          
          {selectedLocations.length > 0 && !insufficientFunds && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Info size={14} className="text-lemon-hover" />
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest">
                You are about to post to {selectedLocations.length} locations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelectionModal;
