
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  Calendar,
  X,
  ChevronDown,
  MapPin,
  Facebook,
  Instagram,
  Wallet,
  Check,
} from "lucide-react";
import Link from "next/link";

const RECOMMENDED_GMB = [9, 10, 13, 14];
const RECOMMENDED_INSTA = [11, 12, 18, 19, 20];
const RECOMMENDED_FB = [13, 14, 18, 19];

const ScheduleModal = React.memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  post, 
  availableLocations = [], 
  facebookPages = [], 
  instagramAccounts = [],
  fetchFacebookPages,
  fetchInstagramAccounts,
  loadingFb,
  loadingIg,
  userWallet,
  setShowInsufficientBalance,
  setRequiredCoins
}) => {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [slot, setSlot] = useState(() => {
    const now = new Date();
    return now.getHours() + 1;
  });

  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('gmb');
  
  const [selectedGmb, setSelectedGmb] = useState([]);
  const [selectedFb, setSelectedFb] = useState([]);
  const [selectedIg, setSelectedIg] = useState([]);

  useEffect(() => {
    if (activeTab === 'fb' && facebookPages.length === 0 && fetchFacebookPages) {
      fetchFacebookPages();
    }
    if (activeTab === 'ig' && instagramAccounts.length === 0 && fetchInstagramAccounts) {
      fetchInstagramAccounts();
    }
  }, [activeTab, facebookPages.length, instagramAccounts.length, fetchFacebookPages, fetchInstagramAccounts]);

  const totalCost = useMemo(() => selectedGmb.length * 20, [selectedGmb.length]);

  const handleConfirm = useCallback(() => {
    if (userWallet < totalCost) {
      setRequiredCoins(totalCost);
      setShowInsufficientBalance(true);
      return;
    }

    const scheduledTime = new Date(date);
    scheduledTime.setHours(parseInt(slot), 0, 0, 0);
    
    onConfirm(post._id, "scheduled", scheduledTime.toISOString(), {
      gmb: selectedGmb,
      fb: selectedFb,
      ig: selectedIg
    });
    onClose();
  }, [userWallet, totalCost, date, slot, onConfirm, post?._id, selectedGmb, selectedFb, selectedIg, onClose, setRequiredCoins, setShowInsufficientBalance]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const formatTime = (hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;
        return `${h}:00 ${ampm}`;
      };
      return { 
        value: i, 
        label: `${formatTime(i)} - ${formatTime((i + 1) % 24)}`, 
        isGmb: RECOMMENDED_GMB.includes(i), 
        isInsta: RECOMMENDED_INSTA.includes(i), 
        isFb: RECOMMENDED_FB.includes(i) 
      };
    });
  }, []);

  const isSlotDisabled = useCallback((slotValue) => {
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const isToday = y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate();

    if (isToday) {
      return slotValue <= now.getHours();
    }
    return false;
  }, [date]);

  const toggleSelection = useCallback((id, list, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);

  const toggleAll = useCallback((items, selected, setSelected, idKey = 'id') => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map(i => i[idKey]));
    }
  }, []);

  const verifiedLocations = useMemo(() => availableLocations.filter(loc => loc.isVerified), [availableLocations]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'gmb', label: 'Google', icon: MapPin, cost: '20 Coins/Loc', count: selectedGmb.length },
    { id: 'fb', label: 'Facebook', icon: Facebook, cost: 'Free', count: selectedFb.length },
    { id: 'ig', label: 'Instagram', icon: Instagram, cost: 'Free', count: selectedIg.length }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Calendar className="w-6 h-6 text-[#EAB308]" />
              Schedule Post
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Select when and where this post will go live.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-50/50">
          
          {/* Left Panel: Date & Time */}
          <div className="w-full md:w-2/5 p-6 border-r border-slate-100 bg-white overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Timing</h3>
            
            <div className="space-y-6">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={(() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    className="w-full pl-4 pr-10 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#EAB308] outline-none text-slate-800 font-semibold bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {/* Time Dropdown */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-bold text-slate-700">Time Slot</label>
                  <span className="text-[10px] font-bold text-[#EAB308] uppercase tracking-widest bg-[#EAB308]/10 px-2 py-0.5 rounded border border-[#EAB308]/20">
                    Follows best practices
                  </span>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl bg-slate-50 hover:bg-white text-left flex justify-between items-center text-slate-800 font-semibold focus:outline-none focus:border-[#EAB308] transition-colors"
                  >
                    <span>{timeSlots.find((s) => s.value === parseInt(slot))?.label || "Select Time"}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showTimeDropdown ? "rotate-180 text-[#EAB308]" : ""}`} />
                  </button>

                  {showTimeDropdown && (
                    <div className="absolute z-50 w-full top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                      <div className="p-1.5">
                        {timeSlots
                          .filter((s) => !isSlotDisabled(s.value))
                          .map((s) => {
                            const isSelected = parseInt(slot) === s.value;
                            const isRecommended = s.isGmb || s.isInsta || s.isFb;
                            
                            return (
                              <div
                                key={s.value}
                                onClick={() => {
                                  setSlot(s.value);
                                  setShowTimeDropdown(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer mb-0.5
                                  ${isSelected 
                                    ? "bg-[#EAB308] text-black font-bold shadow-sm"
                                    : isRecommended 
                                      ? "bg-amber-50/50 text-amber-900 font-semibold hover:bg-amber-100/50" 
                                      : "text-slate-600 hover:bg-slate-100 font-medium"
                                  }`}
                              >
                                <span className="flex items-center gap-2">
                                  {s.label}
                                  <span className="flex gap-1">
                                    {s.isGmb && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-blue-500"}`} title="Good for Google" />}
                                    {s.isInsta && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-pink-500"}`} title="Good for Instagram" />}
                                    {s.isFb && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-blue-600"}`} title="Good for Facebook" />}
                                  </span>
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-black" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  We highlight the best time slots based on your selected platforms. Look for the colored dots: <br/>
                  <span className="inline-flex items-center gap-1 mt-2 text-blue-900 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Google</span>
                  <span className="inline-flex items-center gap-1 mt-2 ml-3 text-pink-700 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Instagram</span>
                  <span className="inline-flex items-center gap-1 mt-2 ml-3 text-blue-700 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Facebook</span>
                </p>
              </div>

            </div>
          </div>

          {/* Right Panel: Platforms */}
          <div className="w-full md:w-3/5 flex flex-col bg-slate-50/30">
            {/* Tabs - Modern Segmented Control */}
            <div className="p-4 sm:p-6 pb-0">
              <div className="flex bg-slate-200/60 p-1 rounded-2xl">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 px-2 text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 relative ${
                      activeTab === tab.id 
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#EAB308]' : ''}`} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md leading-none ml-1 ${activeTab === tab.id ? 'bg-[#EAB308] text-black' : 'bg-slate-300 text-slate-700'}`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest font-black ${activeTab === tab.id ? 'text-slate-400' : 'text-slate-400'}`}>
                      {tab.cost}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              
              {/* GMB Content */}
              {activeTab === 'gmb' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Available Locations</span>
                    <button 
                      onClick={() => toggleAll(verifiedLocations, selectedGmb, setSelectedGmb, 'id')} 
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      {selectedGmb.length === verifiedLocations.length && verifiedLocations.length > 0 ? 'Deselect All' : 'Select All Verified'}
                    </button>
                  </div>
                  
                  {availableLocations.map(loc => {
                    const isVerified = loc.isVerified;
                    const isSelected = selectedGmb.includes(loc.id);
                    return (
                      <div 
                        key={loc.id} 
                        onClick={() => isVerified && toggleSelection(loc.id, selectedGmb, setSelectedGmb)}
                        className={`flex items-start sm:items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${!isVerified ? 'opacity-50 bg-slate-100 cursor-not-allowed border-transparent' : 'cursor-pointer'} ${isSelected ? 'border-[#EAB308] bg-[#EAB308]/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      >
                        <div className={`mt-1 sm:mt-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? 'bg-[#EAB308] border-[#EAB308]' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start sm:items-center gap-2 flex-col sm:flex-row">
                            <p className={`text-base font-bold truncate ${!isVerified ? 'text-slate-500' : 'text-slate-900'}`}>{loc.name}</p>
                            {!isVerified && <span className="text-[10px] bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest shrink-0">Unverified</span>}
                          </div>
                          <p className="text-sm text-slate-500 truncate mt-0.5 font-medium">{loc.address}</p>
                        </div>
                      </div>
                    );
                  })}
                  {availableLocations.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No Google locations found.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Facebook Content */}
              {activeTab === 'fb' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Connected Pages</span>
                    <button 
                      onClick={() => toggleAll(facebookPages, selectedFb, setSelectedFb, 'pageId')} 
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      {selectedFb.length === facebookPages.length && facebookPages.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  {loadingFb ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  ) : facebookPages.length > 0 ? (
                    facebookPages.map(page => {
                      const isSelected = selectedFb.includes(page.pageId);
                      return (
                        <div 
                          key={page.pageId} 
                          onClick={() => toggleSelection(page.pageId, selectedFb, setSelectedFb)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="flex-1">
                            <span className="text-base font-bold text-slate-900">{page.pageName}</span>
                          </div>
                          <Facebook className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <Facebook className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No Facebook pages connected.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Instagram Content */}
              {activeTab === 'ig' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Connected Accounts</span>
                    <button 
                      onClick={() => toggleAll(instagramAccounts, selectedIg, setSelectedIg, 'igId')} 
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      {selectedIg.length === instagramAccounts.length && instagramAccounts.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {loadingIg ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pink-600" /></div>
                  ) : instagramAccounts.length > 0 ? (
                    instagramAccounts.map(acc => {
                      const isSelected = selectedIg.includes(acc.igId);
                      return (
                        <div 
                          key={acc.igId} 
                          onClick={() => toggleSelection(acc.igId, selectedIg, setSelectedIg)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-slate-100 bg-white hover:border-pink-200 hover:shadow-sm'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? 'bg-pink-600 border-pink-600' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="flex-1">
                            <span className="text-base font-bold text-slate-900">{acc.igUsername}</span>
                          </div>
                          <Instagram className={`w-5 h-5 ${isSelected ? 'text-pink-600' : 'text-slate-300'}`} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                      <Instagram className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No Instagram accounts connected.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0">
          
          <div className="flex items-center gap-4 w-full sm:w-auto bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Total Cost</span>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-black leading-none ${userWallet < totalCost ? "text-red-500" : "text-slate-900"}`}>{totalCost}</span>
                <span className="text-xs font-bold text-slate-400 mb-0.5">Coins</span>
              </div>
            </div>
            
            {userWallet < totalCost && (
              <div className="pl-4 border-l border-slate-200 flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Balance</span>
                <span className="text-sm font-bold text-red-500 leading-none mt-1">{userWallet}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose} 
              className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-sm"
            >
              Cancel
            </button>

            {userWallet < totalCost ? (
              <Link href="/wallet" className="flex-1 sm:flex-none">
                <button className="w-full px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 text-sm shadow-slate-900/20">
                  <Wallet className="w-4 h-4" />
                  Recharge
                </button>
              </Link>
            ) : (
              <button 
                onClick={handleConfirm} 
                disabled={selectedGmb.length === 0 && selectedFb.length === 0 && selectedIg.length === 0}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-[#EAB308] text-black rounded-2xl font-black uppercase tracking-wide hover:bg-[#FACC15] hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-[#EAB308]/20"
              >
                <Calendar className="w-4 h-4" />
                Schedule Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ScheduleModal.displayName = "ScheduleModal";

export default ScheduleModal;