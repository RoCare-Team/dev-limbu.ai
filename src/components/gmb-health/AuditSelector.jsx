import React from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";

const AuditSelector = React.memo(({ 
  locations, 
  selectedLocationId, 
  setSelectedLocationId, 
  loading, 
  handleGenerateReport 
}) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 mb-8 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Select Your Business Location
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-slate-300 group-focus-within:text-lemon-hover transition-colors" />
            </div>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-black/10 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
              disabled={loading || locations.length === 0}
            >
              {locations.length === 0 ? (
                <option>No locations found</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.title} {loc.locality ? `— ${loc.locality}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading || locations.length === 0}
          className="btn-lemon w-full md:w-auto px-8 py-3 rounded-xl shadow-lg hover:scale-[1.02] disabled:opacity-50 text-[10px] font-black uppercase tracking-widest gap-2 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Check Health ↗
            </>
          )}
        </button>
      </div>
    </div>
  );
});

AuditSelector.displayName = "AuditSelector";
export default AuditSelector;