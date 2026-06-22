import { XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
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
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Account</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scroll">
                  {linkedinPages.map((page) => (
                    <button
                      key={page.pageId}
                      onClick={() => setSelectedPage(page.pageId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedPage === page.pageId
                        ? "border-[#0A66C2] bg-[#0A66C2]/5"
                        : "border-slate-100 hover:border-[#0A66C2]/30 hover:bg-slate-50"
                        }`}
                    >
                      {page.image ? (
                        <Image src={page.image} alt="" width={36} height={36} className="rounded-full object-cover shrink-0" unoptimized />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <Image src="/social-icon/linkedin.png" width={16} height={16} alt="LinkedIn" className="opacity-50" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">
                          {page.pageName || page.localizedName}
                        </p>
                        {page.vanityName ? (
                          <p className="text-[10px] text-slate-500 truncate">@{page.vanityName}</p>
                        ) : (
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{page.type}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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
