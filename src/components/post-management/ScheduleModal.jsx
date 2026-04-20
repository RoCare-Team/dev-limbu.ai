
"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  Clock,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Send,
  XCircle,
  Download,
  Share2,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  ChevronDown,
  MapPin,
  Pencil,
  Facebook,
  Instagram,
  ThumbsUp,
  MessageCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";


const ScheduleModal = ({ 
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
  const [activeTab, setActiveTab] = useState('gmb'); // 'gmb', 'fb', 'ig'
  
  // Selection States
  const [selectedGmb, setSelectedGmb] = useState([]);
  const [selectedFb, setSelectedFb] = useState([]);
  const [selectedIg, setSelectedIg] = useState([]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'fb' && facebookPages.length === 0 && fetchFacebookPages) {
      fetchFacebookPages();
    }
    if (activeTab === 'ig' && instagramAccounts.length === 0 && fetchInstagramAccounts) {
      fetchInstagramAccounts();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Calculate Total Cost
  const totalCost = selectedGmb.length * 20;

  const handleConfirm = () => {
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
  };


  // Recommended slots for GMB (Mon-Fri): 9-11 AM, 1-3 PM
  // Instagram: 11 AM-1 PM, 6-9 PM
  // Facebook: 1-3 PM, 6-8 PM
  const recommendedGmb = [9, 10, 13, 14];
  const recommendedInsta = [11, 12, 18, 19, 20];
  const recommendedFb = [13, 14, 18, 19];

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const formatTime = (hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h = hour % 12 || 12;
      return `${h}:00 ${ampm}`;
    };
    const label = `${formatTime(i)} - ${formatTime((i + 1) % 24)}`;
    const isGmb = recommendedGmb.includes(i);
    const isInsta = recommendedInsta.includes(i);
    const isFb = recommendedFb.includes(i);
    return { value: i, label, isGmb, isInsta, isFb };
  });

  // Posting Recommendations
  const postingTips = [
    {
      platform: 'Google Business (GMB)',
      best: [
        'Weekdays (Mon–Fri):',
        '⏰ 9:00 AM – 11:00 AM',
        '⏰ 1:00 PM – 3:00 PM',
        '⭐ Best day: Wednesday & Thursday',
        'Avoid: Late night (after 10 PM), Early morning (before 7 AM)'
      ]
    },
    {
      platform: 'Instagram',
      best: [
        'Weekdays:',
        '⏰ 11:00 AM – 1:00 PM',
        '⏰ 6:00 PM – 9:00 PM',
        '⭐ Best day: Tuesday, Wednesday & Friday'
      ]
    }
  ];

  const isSlotDisabled = (slotValue) => {
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const isToday = y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate();

    if (isToday) {
      return slotValue <= now.getHours();
    }
    return false;
  };

  const toggleSelection = (id, list, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAll = (items, selected, setSelected, idKey = 'id') => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map(i => i[idKey]));
    }
  };

  // Filter verified locations for GMB
  const verifiedLocations = availableLocations.filter(loc => loc.isVerified);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden flex flex-col max-h-[70vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-dark" />
              Schedule Post
            </h2>
            <p className="text-sm text-gray-500 mt-1">Choose date, time, and platforms.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Left Panel: Date & Time */}
          <div className="w-full md:w-1/3 p-6 border-r border-gray-100 bg-gray-50/30 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">When</h3>
            {/* ...existing code... */}
            <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    Time Slot
  </label>

  <div className="relative">
    {/* Trigger Button */}
    <button
      onClick={() => setShowTimeDropdown(!showTimeDropdown)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-left
      flex justify-between items-center text-sm text-gray-700
      hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-600 transition"
    >
      <span className={`${slot ? "text-gray-800" : "text-gray-400"}`}>
        {timeSlots.find((s) => s.value === parseInt(slot))?.label || "Select Time"}
      </span>

      <ChevronDown
        className={`w-5 h-5 text-gray-400 transition-transform ${
          showTimeDropdown ? "rotate-180" : ""
        }`}
      />
    </button>

    {/* Dropdown (CENTERED) */}
    {showTimeDropdown && (
      <div
        className="
          absolute z-50 w-full
          top-1/2 -translate-y-1/2
          bg-white border border-gray-200
          rounded-xl shadow-2xl
          max-h-56 overflow-y-auto
        "
      >
        {timeSlots
          .filter((s) => !isSlotDisabled(s.value))
          .map((s) => {
            const isSelected = parseInt(slot) === s.value;
            return (
              <div
                key={s.value}
                onClick={() => {
                  setSlot(s.value);
                  setShowTimeDropdown(false);
                }}
                className={`flex items-center justify-between px-4 py-3 text-sm transition cursor-pointer
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : (s.isGmb || s.isInsta || s.isFb)
                        ? "bg-yellow-50 text-yellow-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="flex items-center gap-1">
                  {s.label}
                  {s.isInsta && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[10px] font-bold ml-1 shadow-sm border border-pink-200 animate-fade-in">
                      Insta 
                    </span>
                  )}
                  {s.isFb && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold ml-1 shadow-sm border border-blue-200 animate-fade-in">
                      FB
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </div>
            );
          })}
      </div>
    )}
  </div>
</div>


        </div>
          </div>

          {/* Right Panel: Platforms */}
          <div className="w-full md:w-2/3 flex flex-col bg-white">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                // { id: 'all', label: 'All Platforms', icon: CheckCircle, color: 'text-green-600', badge: 'Select All' },
                { id: 'gmb', label: 'Google', icon: MapPin, color: 'text-dark', badge: '20 Coins/Loc' },
                { id: 'fb', label: 'Facebook', icon: Facebook, color: 'text-dark', badge: 'Free' },
                { id: 'ig', label: 'Instagram', icon: Instagram, color: 'text-dark', badge: 'Free' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'all') {
                      // Select all platforms
                      setSelectedGmb(verifiedLocations.map(loc => loc.id));
                      setSelectedFb(facebookPages.map(p => p.pageId));
                      setSelectedIg(instagramAccounts.map(a => a.igId));
                      setActiveTab('gmb'); // Switch to GMB tab after selection
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex-1 py-3 text-sm font-medium flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? `border-blue-500 bg-blue-50/50 ${tab.color}` 
                      : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tab.id === 'all' ? 'bg-fullLight text-lightPrimary' : tab.badge === 'Free' ? 'bg-green-100 text-lightPrimary' : 'bg-yellow-100 text-lightPrimary'}`}>
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* GMB Content */}
              {activeTab === 'gmb' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Select Locations</span>
                    <button onClick={() => toggleAll(verifiedLocations, selectedGmb, setSelectedGmb, 'id')} className="text-xs text-neutral-600 hover:underline font-medium">
                      {selectedGmb.length === verifiedLocations.length && verifiedLocations.length > 0 ? 'Deselect All' : 'Select All Verified'}
                    </button>
                  </div>
                  {availableLocations.map(loc => {
                    const isVerified = loc.isVerified;
                    return (
                    <label key={loc.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${!isVerified ? 'opacity-60 bg-gray-50 cursor-not-allowed' : 'cursor-pointer'} ${selectedGmb.includes(loc.id) ? 'border-lighPrimary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedGmb.includes(loc.id)} 
                        onChange={() => isVerified && toggleSelection(loc.id, selectedGmb, setSelectedGmb)} 
                        disabled={!isVerified}
                        className="w-4 h-4 text-dark rounded focus:ring-neutral-500 disabled:text-gray-400" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className={`text-sm font-medium truncate ${!isVerified ? 'text-gray-500' : 'text-gray-900'}`}>{loc.title}</p>
                            {!isVerified && <span className="text-[10px] bg-red-100 text-lightPrimary px-1.5 py-0.5 rounded font-bold">Unverified</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{loc.address}</p>
                      </div>
                    </label>
                  )})}
                  {availableLocations.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No GMB locations found.</p>}
                </div>
              )}

              {/* Facebook Content */}
              {activeTab === 'fb' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-dark uppercase">Select Pages</span>
                    <button onClick={() => toggleAll(facebookPages, selectedFb, setSelectedFb, 'pageId')} className="text-xs text-dark hover:underline font-medium">
                      {selectedFb.length === facebookPages.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {loadingFb ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-dark" /></div>
                  ) : facebookPages.length > 0 ? (
                    facebookPages.map(page => (
                      <label key={page.pageId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFb.includes(page.pageId) ? 'border-lightPrimary bg-blue-50' : 'border-gray-200 hover:border-yellow-300'}`}>
                        <input type="checkbox" checked={selectedFb.includes(page.pageId)} onChange={() => toggleSelection(page.pageId, selectedFb, setSelectedFb)} className="w-4 h-4 text-lightPrimary rounded focus:ring-lightPrimary" />
                        <span className="text-sm font-medium text-dark">{page.pageName}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-8">No Facebook pages connected.</p>
                  )}
                </div>
              )}

              {/* Instagram Content */}
              {activeTab === 'ig' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-dark uppercase">Select Accounts</span>
                    <button onClick={() => toggleAll(instagramAccounts, selectedIg, setSelectedIg, 'igId')} className="text-xs text-dark hover:underline font-medium">
                      {selectedIg.length === instagramAccounts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {loadingIg ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-lighPrimary" /></div>
                  ) : instagramAccounts.length > 0 ? (
                    instagramAccounts.map(acc => (
                      <label key={acc.igId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedIg.includes(acc.igId) ?  'border-lightPrimary bg-pink-50'  : 'border-gray-200 hover:border-lightPrimary'}`} >
                        <input type="checkbox" checked={selectedIg.includes(acc.igId)} onChange={() => toggleSelection(acc.igId, selectedIg, setSelectedIg)} className="w-4 h-4 text-lightPrimary rounded focus:ring-dark" />
                        <span className="text-sm font-medium text-dark">{acc.igUsername}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-dark text-sm py-8">No Instagram accounts connected.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-dark font-medium uppercase tracking-wide">Required Coins</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold ${userWallet < totalCost ? "text-red-600" : "text-neutral-600"}`}>{totalCost}</span>
              {userWallet < totalCost && (
                <span className="text-xs text-dark font-medium">
                  (Available: {userWallet})
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-dark rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            {userWallet < totalCost ? (
              <Link href="/wallet">
                <button className="px-6 py-2.5 bg-dark text-lightPrimary rounded-xl font-semibold hover:bg-neutral-700 transition-all shadow-lg flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4" />
                  Add Coins
                </button>
              </Link>
            ) : (
              <button 
                onClick={handleConfirm} 
                disabled={selectedGmb.length === 0 && selectedFb.length === 0 && selectedIg.length === 0}
                className="px-6 py-2.5 bg-lightPrimary text-dark rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <Calendar className="w-4 h-4" />
                Schedule Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default ScheduleModal;