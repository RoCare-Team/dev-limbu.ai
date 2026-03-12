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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl 
       w-full max-w-2xl
       max-h-[70vh]            /* 🔥 height reduced */
       mt-10                   /* 🔥 top margin */
       overflow-y-auto         /* scroll inside */
       p-6 sm:p-8 
       border-4 border-blue-200
       animate-scale-in">
  
        {/* Modal Header */}
        <div className="relative text-center mb-6 sm:mb-8 flex-shrink-0">
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4 sm:space-y-6 flex-grow overflow-y-auto">
          <div className="text-center">
              {title.includes("Post") && (
                <p className="text- text-sm sm:text-base mt-2">Choose locations to post (20 coins per location)</p>
              )}
              {/* Checkmark options for Post and Photo */}
              <div className="flex justify-center gap-4 sm:gap-6 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="post-checkbox"
                    checked={checkmark.includes('post')}
                    onChange={() => handleCheckmarkChange('post')}
                    className="h-5 w-5 rounded border-gray-300 accent-lightPrimary text-dark focus:ring-dark cursor-pointer"
                  />
                  <label htmlFor="post-checkbox" className="ml-2 text-dark font-medium cursor-pointer">Post</label>
                </div>
  
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="photo-checkbox"
                    checked={checkmark.includes('photo')}
                    onChange={() => handleCheckmarkChange('photo')}
                    className="h-5 w-5 rounded border-gray-300 accent-lightPrimary text-dark focus:ring-dark cursor-pointer"
                  />
                  <label htmlFor="photo-checkbox" className="ml-2 text-dark font-medium cursor-pointer">Photo</label>
                </div>
              </div>
              {/* Select All checkbox */}
              <div className="mt-4 flex items-center justify-end">
                <input
                  type="checkbox"
                  id="select-all-checkbox"
                  checked={verifiedLocations.length > 0 && selectedLocations.length === verifiedLocations.length}
                  onChange={handleSelectAll}
                  className="h-5 w-5 rounded border-gray-300 text-dark focus:ring-dark cursor-pointer"
                />
                <label htmlFor="select-all-checkbox" className="ml-2 text-dark font-medium cursor-pointer">
                  {selectedLocations.length === verifiedLocations.length ? 'Deselect All' : 'Select All'}
                </label>
              </div>
            </div>
            
            {/* Summary Card */}
            <div className="bg-lightPrimary border-neutral-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div>
                  <p className="text-sm text-dark">Selected Locations</p>
                  <p className="text-xl font-black text-primary">{selectedLocations.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark text-right">Cost per Location</p>
                  <p className="text-xl font-black text-primary">20 coins</p>
                </div>
              </div>
              
              {isPostAction && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark">Your Wallet</p>
                    <p className={`text-xl font-black ${insufficientFunds ? 'text-white' : 'text-primary'}`}>
                      {walletBalance} coins
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className={`text-xl font-black ${insufficientFunds ? 'text-primary' : 'text-primary'}`}>
                      {totalCost} coins
                    </p>
                  </div>
                </div>
              )}
              
              {isPostAction && insufficientFunds && (
                 <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                    <p className="text-red-700 text-sm font-bold">
                       Insufficient Balance! You need {totalCost - walletBalance} more coins.
                    </p>
                 </div>
              )}
            </div>
            
            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto space-y-3">
              {verifiedLocations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedLocations.includes(location.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedLocations.includes(location.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                        }`}>
                        {selectedLocations.includes(location.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">{location.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {location.address}
                        </p>
                      </div>
                    </div>
                    <span className="text-dark font-bold text-sm">20 coins</span>
                  </div>
                </div>
              ))}
              {unverifiedLocations.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm font-bold text-gray-500 mb-2 border-t pt-3">Unverified Locations (Cannot be selected)</p>
                  {unverifiedLocations.map((location) => (
                    <div
                      key={location.id}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed mt-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-gray-400">
                            <XCircle className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-600 text-sm sm:text-base">{location.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {location.address}
                            </p>
                          </div>
                        </div>
                        <span className="text-dark font-bold text-sm">20 coins</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
  
            {selectedLocations.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 sm:p-4">
                <p className="text-sm text-amber-900 flex items-start gap-2">
                  <span className="text-lg sm:text-xl">💡</span>
                  <span>
                    <strong>Selected:</strong> {selectedLocations.length} location{selectedLocations.length > 1 ? 's' : ''}
                    {' '}• Total posting cost: {selectedLocations.length * 20} coins
                  </span>
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onConfirm(selectedLocations, getPayload())}
                disabled={selectedLocations.length === 0 || insufficientFunds}
                className="flex-1 bg-dark text-primary px-6 py-3 sm:py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {insufficientFunds ? "Recharge to Post" : `${confirmText} to ${selectedLocations.length} Location${selectedLocations.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={onClose} // Close button
                className="flex-1 bg-lightPrimary text-dark px-6 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-300 transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default LocationSelectionModal;