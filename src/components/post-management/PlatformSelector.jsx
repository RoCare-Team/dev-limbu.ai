import { Facebook, Instagram } from "lucide-react";

export default function PlatformSelector({ selectedPlatforms, setSelectedPlatforms }) {
  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const allSelected = ["gmb", "fb", "ig"].every((p) => selectedPlatforms.includes(p));

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedPlatforms(["gmb", "fb", "ig"]);
    } else {
      setSelectedPlatforms([]);
    }
  };

  return (
    <div
      className="flex flex-nowrap overflow-x-auto sm:flex-wrap items-center gap-4 px-4 py-3 sm:px-6 sm:py-2 rounded-2xl border col-span-2 order-last sm:order-none w-full sm:w-auto justify-start sm:justify-center sm:ml-4 shadow-xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderColor: "rgba(253, 224, 71, 0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* All */}
      <label className="flex items-center gap-3 cursor-pointer group flex-shrink-0">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="peer sr-only"
          />
          <div className="w-5 h-5 rounded border-2 border-slate-200 peer-checked:border-[#EAB308] peer-checked:bg-[#EAB308] transition-all flex items-center justify-center">
             {allSelected && (
               <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
             )}
          </div>
        </div>
        <span 
          className="text-sm font-medium tracking-widest uppercase text-slate-900/70 group-hover:text-slate-900 transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          All
        </span>
      </label>

      {/* GMB */}
      <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
        <input
          type="checkbox"
          checked={selectedPlatforms.includes("gmb")}
          onChange={() => togglePlatform("gmb")}
          className="sr-only peer"
        />
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${
            selectedPlatforms.includes("gmb")
              ? "bg-slate-100 border-[#EAB308] shadow-[0_0_15px_rgba(253,224,71,0.2)] scale-110"
              : "bg-slate-50 border-slate-200 grayscale opacity-60 group-hover:opacity-100 group-hover:border-white/30"
          }`}
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
            alt="Google"
            className="w-5 h-5 object-contain"
          />
        </div>
      </label>

      {/* Facebook */}
      <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
        <input
          type="checkbox"
          checked={selectedPlatforms.includes("fb")}
          onChange={() => togglePlatform("fb")}
          className="sr-only peer"
        />
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${
            selectedPlatforms.includes("fb")
              ? "bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.3)] scale-110"
              : "bg-slate-50 border-slate-200 text-slate-900/40 grayscale opacity-60 group-hover:opacity-100 group-hover:border-white/30"
          }`}
        >
          <Facebook className="w-5 h-5 fill-current" />
        </div>
      </label>

      {/* Instagram */}
      <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
        <input
          type="checkbox"
          checked={selectedPlatforms.includes("ig")}
          onChange={() => togglePlatform("ig")}
          className="sr-only peer"
        />
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${
            selectedPlatforms.includes("ig")
              ? "bg-gradient-to-tr from-[#FFD600]/20 via-[#FF0169]/20 to-[#D300C5]/20 border-[#FF0169] text-[#FF0169] shadow-[0_0_15px_rgba(255,1,105,0.3)] scale-110"
              : "bg-slate-50 border-slate-200 text-slate-900/40 grayscale opacity-60 group-hover:opacity-100 group-hover:border-white/30"
          }`}
        >
          <Instagram className="w-5 h-5" />
        </div>
      </label>
    </div>
  );
}
