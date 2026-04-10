import { FileText, Eye } from "lucide-react";
import PlatformSelector from "./PlatformSelector";

export default function PostManagementHeader({ 
  selectedPlatforms, 
  setSelectedPlatforms, 
  previewData 
}) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-4 mb-6">
      {/* Title */}
      <div
        className="inline-flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border whitespace-nowrap shadow-xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderColor: "rgba(15, 23, 42, 0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <FileText className="w-5 h-5 text-[#EAB308]" />
        </div>
        <span 
          className="text-base sm:text-xl font-normal text-slate-900 uppercase tracking-wider"
          style={{ fontFamily: "Anton, Impact, sans-serif" }}
        >
          Post <span className="text-[#EAB308]">Management</span>
        </span>
      </div>

      <PlatformSelector 
        selectedPlatforms={selectedPlatforms} 
        setSelectedPlatforms={setSelectedPlatforms} 
      />

      {/* Preview Button */}
      <a
        href={previewData?.aiOutput || "#"}
        target={previewData?.aiOutput ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all duration-300 justify-self-end whitespace-nowrap sm:ml-auto shadow-xl border ${
          previewData?.aiOutput 
            ? "bg-[#EAB308] text-black border-transparent hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(253,224,71,0.3)]"
            : "bg-white text-slate-900/30 border-slate-200 cursor-not-allowed"
        }`}
        style={{ fontFamily: "Inter, sans-serif" }}
        onClick={(e) => {
          if (!previewData?.aiOutput) e.preventDefault();
        }}
      >
        <Eye className={`w-5 h-5 ${previewData?.aiOutput ? "text-black" : "text-slate-900/30"}`} />
        Preview
      </a>
    </div>
  );
}
