import React from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";
import Select from "react-select";

const AuditSelector = React.memo(({ 
  locations, 
  selectedLocationId, 
  setSelectedLocationId, 
  loading, 
  handleGenerateReport 
}) => {
  // Format locations for react-select
  const locationOptions = locations.map((loc) => {
    const title = loc.title || "";
    const locality = loc.locality || "";
    const label = locality ? `${title} — ${locality}` : title;
    return { value: loc.locationId, label };
  });

  const selectedOption = locationOptions.find((opt) => opt.value === selectedLocationId) || null;

  // Custom styles for react-select to match the design system
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#f8fafc", // slate-50 to match previous
      borderColor: state.isFocused ? "var(--lemon-glow)" : "rgba(0, 0, 0, 0.1)",
      boxShadow: state.isFocused ? "0 0 0 2px var(--lemon-glow)" : "none",
      borderRadius: "0.75rem", // rounded-xl
      padding: "0.25rem 0.25rem 0.25rem 2.5rem", // Add left padding to make room for absolute icon
      fontSize: "0.875rem", // text-sm
      fontWeight: "700", // font-bold
      color: "#334155", // slate-700
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
      fontSize: "0.875rem",
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
      color: "#334155",
    }),
    input: (provided) => ({
      ...provided,
      color: "#334155",
      margin: "0px",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0px",
    })
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 mb-8 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Select Your Business Location
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-lemon-hover transition-colors" />
            </div>
            <Select
              value={selectedOption}
              onChange={(option) => setSelectedLocationId(option.value)}
              options={locationOptions}
              styles={customStyles}
              placeholder={locations.length === 0 ? "No locations found" : "Search your business..."}
              isSearchable={true}
              blurInputOnSelect={true}
              isDisabled={loading || locations.length === 0}
              menuPlacement="auto"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading || locations.length === 0 || !selectedLocationId}
          className="btn-lemon w-full md:w-auto px-8 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] disabled:opacity-50 text-[10px] font-black uppercase tracking-widest gap-2 flex items-center justify-center h-full"
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