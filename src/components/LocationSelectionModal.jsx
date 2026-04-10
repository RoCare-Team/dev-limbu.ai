import React, { useState } from 'react';
import { CheckCircle, MapPin, XCircle } from 'lucide-react';

const LocationSelectionModal = ({ locations, onClose, onConfirm, title = "Select Locations", confirmText = "Confirm", initialSelected = [], walletBalance = 0 }) => {
    const [selectedLocations, setSelectedLocations] = useState(initialSelected);
    const [checkmark, setCheckmark] = useState(['post', 'photo']); // Default to both selected
  
    const handleCheckmarkChange = (option) => {
      setCheckmark(prev =>
        prev.includes(option)
          ? prev.filter(item => item !== option)
          : [...prev, option]
      );
    };
    
  
    const getPayload = () => {
      const hasPost = checkmark.includes('post');
      const hasPhoto = checkmark.includes('photo');
  
      if (hasPost && hasPhoto) return 'both';
      if (hasPost) return 'post';
      if (hasPhoto) return 'photo';
  
      return 'post'; // Default to 'post' if nothing is selected
    };
  
    const toggleLocation = (locationId) => {
      setSelectedLocations(prev =>
        prev.includes(locationId)
          ? prev.filter(id => id !== locationId)
          : [...prev, locationId]
      );
    };
  
    const handleSelectAll = () => {
      const verifiedLocations = locations.filter(loc => loc.isVerified);
      if (selectedLocations.length === verifiedLocations.length) {
        setSelectedLocations([]); // Deselect all
      } else {
        setSelectedLocations(verifiedLocations.map(loc => loc.id)); // Select all verified
      }
    };
    const verifiedLocations = locations.filter(loc => loc.isVerified);
    const unverifiedLocations = locations.filter(loc => !loc.isVerified);

    const isPostAction = title.toLowerCase().includes("post");
    const totalCost = selectedLocations.length * 20;
    const insufficientFunds = isPostAction && (walletBalance < totalCost);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-[2.5rem] shadow-2xl 
       w-full max-w-2xl
       max-h-[85vh]
       overflow-hidden
       flex flex-col
       border border-black/5
       animate-scaleUp">
  
        {/* Modal Header */}
        <div className="bg-black text-white px-6 sm:px-10 py-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
              <MapPin className="text-black w-5 h-5" />
            </div>
            <h3 className="text-xl text-white sm:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto flex-grow custom-scroll bg-slate-50/30">
          <div className="text-center">
              {title.includes("Post") && (
                <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4">Choose locations to post (20 coins per location)</p>
              )}
              
              {/* Checkmark options for Post and Photo */}
              <div className="flex justify-center gap-6">
                <label className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={checkmark.includes('post')}
                      onChange={() => handleCheckmarkChange('post')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${checkmark.includes('post') ? 'bg-black border-black shadow-lg shadow-black/10' : 'bg-white border-slate-300 group-hover:border-yellow-400'}`}>
                      {checkmark.includes('post') && <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-black text-black uppercase tracking-widest">Post</span>
                </label>
  
                <label className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={checkmark.includes('photo')}
                      onChange={() => handleCheckmarkChange('photo')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${checkmark.includes('photo') ? 'bg-black border-black shadow-lg shadow-black/10' : 'bg-white border-slate-300 group-hover:border-yellow-400'}`}>
                      {checkmark.includes('photo') && <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-black text-black uppercase tracking-widest">Photo</span>
                </label>
              </div>

              {/* Select All */}
              <div className="mt-6 flex items-center justify-end">
                <label className="flex items-center group cursor-pointer">
                  <span className="mr-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-black transition-colors">
                    {selectedLocations.length === verifiedLocations.length ? 'Deselect All' : 'Select All Verified'}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={verifiedLocations.length > 0 && selectedLocations.length === verifiedLocations.length}
                      onChange={handleSelectAll}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${verifiedLocations.length > 0 && selectedLocations.length === verifiedLocations.length ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/20' : 'bg-white border-slate-300 group-hover:border-black'}`}>
                      {verifiedLocations.length > 0 && selectedLocations.length === verifiedLocations.length && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Summary Card */}
            <div className="bg-white border border-black/5 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected</p>
                  <p className="text-2xl font-black text-black leading-none">{selectedLocations.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost / Loc</p>
                  <p className="text-2xl font-black text-black leading-none">20 <span className="text-xs uppercase opacity-50">coins</span></p>
                </div>
              </div>
              
              {isPostAction && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Wallet</p>
                    <p className={`text-2xl font-black leading-none ${insufficientFunds ? 'text-red-500' : 'text-yellow-600'}`}>
                      {walletBalance} <span className="text-xs uppercase opacity-50">coins</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cost</p>
                    <p className="text-2xl font-black text-black leading-none">
                      {totalCost} <span className="text-xs uppercase opacity-50">coins</span>
                    </p>
                  </div>
                </div>
              )}
              
              {isPostAction && insufficientFunds && (
                 <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                    <p className="text-red-600 text-xs font-bold uppercase tracking-widest">
                       ⚠️ Insufficient Balance! Need {totalCost - walletBalance} more coins.
                    </p>
                 </div>
              )}
            </div>
            
            <div className="space-y-3">
              {verifiedLocations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedLocations.includes(location.id)
                    ? 'border-black bg-white shadow-xl shadow-black/5 scale-[1.01]'
                    : 'border-black/5 bg-white hover:border-yellow-400 hover:bg-yellow-400/5'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedLocations.includes(location.id)
                        ? 'bg-black border-black'
                        : 'bg-white border-slate-200'
                        }`}>
                        {selectedLocations.includes(location.id) && (
                          <CheckCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-black text-sm uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{location.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {location.address}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-black uppercase tracking-widest opacity-40">20c</span>
                  </div>
                </div>
              ))}

              {unverifiedLocations.length > 0 && (
                <div className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] flex-1 bg-black/5" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Locked Locations</p>
                    <div className="h-[1px] flex-1 bg-black/5" />
                  </div>
                  {unverifiedLocations.map((location) => (
                    <div
                      key={location.id}
                      className="p-5 rounded-2xl border border-black/5 bg-slate-50 opacity-40 cursor-not-allowed mt-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-400 text-sm uppercase tracking-tight">{location.name || location.title}</p>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {location.address}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Locked</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 sm:p-10 bg-white border-t border-black/5 flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <button
                onClick={() => onConfirm(selectedLocations, getPayload())}
                disabled={selectedLocations.length === 0 || insufficientFunds}
                className="btn-lemon flex-1 py-4 rounded-2xl text-xs uppercase font-black tracking-[0.2em] shadow-xl hover:scale-[1.02] disabled:opacity-30"
              >
                {insufficientFunds ? "Recharge Wallet" : `${confirmText} Post ↗`}
              </button>
              <button
                onClick={onClose}
                className="btn-ghost flex-1 py-4 rounded-2xl text-xs uppercase font-black tracking-[0.2em]"
              >
                Cancel Action
              </button>
          </div>
        </div>
      </div>
    );
  };

  export default LocationSelectionModal;