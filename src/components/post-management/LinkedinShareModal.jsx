import { XCircle, Loader2, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function LinkedinShareModal({
  isOpen,
  onClose,
  post,
  linkedinPages,
  onPost,
}) {
  const [selectedPage, setSelectedPage] = useState("");
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (post) {
      setCaption(post.liDescription || "");
    }
  }, [post]);

  useEffect(() => {
    if (linkedinPages && linkedinPages.length > 0 && !selectedPage) {
      setSelectedPage(linkedinPages[0].pageId);
    }
  }, [linkedinPages, selectedPage]);

  // Dropdown के बाहर क्लिक करने पर ड्रॉपडाउन बंद करने के लिए
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !post) return null;

  const handlePublish = async () => {
    if (!selectedPage) return;
    setIsPublishing(true);
    try {
      await onPost({ ...post, linkedinDescription: caption }, selectedPage);
    } finally {
      setIsPublishing(false);
    }
  };

  // वर्तमान में सिलेक्टेड पेज का डेटा निकालने के लिए
  const selectedPageData = linkedinPages?.find((page) => page.pageId === selectedPage);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
              <Image src="/social-icon/linkedin.png" width={20} height={20} className="object-contain" alt="LinkedIn" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight">Share to LinkedIn</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select a profile or company page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!linkedinPages || linkedinPages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-4">No LinkedIn accounts connected.</p>
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/linkedin/login?userId=${userId}`;
                }}
                className="bg-[#0A66C2] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Connect LinkedIn
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Account Dropdown Section */}
              <div className="relative" ref={dropdownRef}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Account</p>
                
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition-all text-left focus:ring-2 focus:ring-[#0A66C2]/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedPageData?.image ? (
                      <Image src={selectedPageData.image} alt="" width={32} height={32} className="rounded-full object-cover shrink-0" unoptimized />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Image src="/social-icon/linkedin.png" width={14} height={14} alt="LinkedIn" className="opacity-50" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-sm text-slate-800 truncate">
                        {selectedPageData ? (selectedPageData.pageName || selectedPageData.localizedName) : "Select an account"}
                      </p>
                      {selectedPageData && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {selectedPageData.vanityName ? `@${selectedPageData.vanityName}` : selectedPageData.type}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu List */}
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scroll py-1.5 animate-fadeIn">
                    {linkedinPages.map((page) => (
                      <button
                        key={page.pageId}
                        type="button"
                        onClick={() => {
                          setSelectedPage(page.pageId);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-50 ${
                          selectedPage === page.pageId ? "bg-[#0A66C2]/5 font-semibold" : ""
                        }`}
                      >
                        {page.image ? (
                          <Image src={page.image} alt="" width={28} height={28} className="rounded-full object-cover shrink-0" unoptimized />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <Image src="/social-icon/linkedin.png" width={12} height={12} alt="LinkedIn" className="opacity-50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-slate-800 truncate">
                            {page.pageName || page.localizedName}
                          </p>
                          {page.vanityName ? (
                            <p className="text-[9px] text-slate-500 truncate">@{page.vanityName}</p>
                          ) : (
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{page.type}</p>
                          )}
                        </div>
                        {selectedPage === page.pageId && (
                          <div className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <span className={`text-[10px] font-bold ${caption.length > 3000 ? 'text-red-500' : 'text-slate-400'}`}>
                    {caption.length} / 3000
                  </span>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2]/20 outline-none resize-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Write your LinkedIn post description here..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!selectedPage || isPublishing || caption.length > 3000}
            className="flex-1 py-3.5 bg-[#0A66C2] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#004182] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A66C2]/20"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Image src="/social-icon/linkedin.png" width={16} height={16} className="object-contain brightness-0 invert" alt="LinkedIn" />
            )}
            {isPublishing ? "Publishing..." : "Post Now"}
          </button>
        </div>
      </div>
    </div>
  );
}