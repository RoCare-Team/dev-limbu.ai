import React, { useMemo, useCallback } from "react";
import { FileText, Eye } from "lucide-react";
import PlatformSelector from "./PlatformSelector";

const HEADER_STYLES = {
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  borderColor: "rgba(15, 23, 42, 0.1)",
  backdropFilter: "blur(12px)",
};

const FONT_ANTON = { fontFamily: "Anton, Impact, sans-serif" };
const FONT_INTER = { fontFamily: "Inter, sans-serif" };

const PostManagementHeader = React.memo(({
  selectedPlatforms,
  setSelectedPlatforms,
  previewData
}) => {

  const hasPreview = useMemo(() => Boolean(previewData?.aiOutput), [previewData?.aiOutput]);
  
  const handlePreviewClick = useCallback((e) => {
    if (!hasPreview) e.preventDefault();
  }, [hasPreview]);

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-4 mb-6">
      {/* Title */}
      <div
        className="inline-flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border whitespace-nowrap shadow-xl"
        style={HEADER_STYLES}
      >
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <FileText className="w-5 h-5 text-[#EAB308]" />
        </div>
        <span
          className="text-base sm:text-xl font-normal text-slate-900 uppercase tracking-wider"
          style={FONT_ANTON}
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
        target={hasPreview ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all duration-300 justify-self-end whitespace-nowrap sm:ml-auto shadow-xl border ${
          hasPreview
            ? "bg-[#EAB308] text-black border-transparent hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(253,224,71,0.3)]"
            : "bg-white text-slate-900/30 border-slate-200 cursor-not-allowed"
        }`}
        style={FONT_INTER}
        onClick={handlePreviewClick}
      >
        <Eye className={`w-5 h-5 ${hasPreview ? "text-black" : "text-slate-900/30"}`} />
        Preview
      </a>
    </div>
  );
});

PostManagementHeader.displayName = "PostManagementHeader";

export default PostManagementHeader;
