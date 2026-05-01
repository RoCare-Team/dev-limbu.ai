import React, { useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import DisconnectProfileModal from "@/components/modals/DisconnectProfileModal";

const FacebookColumn = React.memo(({
  facebookPages,
  setFacebookPages,
  handleDisconnectFacebook,
  handleMetaLogout,
}) => {
  const router = useRouter();
  
  const [disconnectModalState, setDisconnectModalState] = useState({
    isOpen: false,
    pageId: null,
    isAll: false
  });

  const confirmDisconnect = () => {
    if (disconnectModalState.isAll) {
      handleMetaLogout();
    } else if (disconnectModalState.pageId) {
      handleDisconnectFacebook(disconnectModalState.pageId);
    }
    setDisconnectModalState({ isOpen: false, pageId: null, isAll: false });
  };

  return (
    <>
      <DisconnectProfileModal 
        isOpen={disconnectModalState.isOpen}
        onClose={() => setDisconnectModalState({ isOpen: false, pageId: null, isAll: false })}
        onConfirm={confirmDisconnect}
        platformName="Facebook"
        customMessage={
          disconnectModalState.isAll 
            ? "Are you sure you want to disconnect ALL Facebook pages? This will revoke access to Meta APIs."
            : "Are you sure you want to disconnect this specific Facebook page?"
        }
      />
      <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden w-full h-[calc(100vh-220px)] min-h-[500px]">
        <div className="p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/social-icon/facebook-icon.png" alt="Facebook" className="w-8 h-8 object-contain" />
              <h2
                className="font-bold text-lg text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Facebook Pages
              </h2>
              {facebookPages.length > 0 && (
                <span className="ml-2 text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {facebookPages.length} Pages
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {facebookPages.length > 0 && (
                 <button
                   onClick={() => {
                     const userId = localStorage.getItem("userId");
                     window.location.href = `/api/facebook/login?userId=${userId}`;
                   }}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold text-[10px] uppercase tracking-wider hover:bg-yellow-500 transition-colors shadow-sm"
                 >
                   <Plus className="w-4 h-4" /> Add Page
                 </button>
              )}
              {facebookPages.length > 0 && (
                <button
                  onClick={() => setDisconnectModalState({ isOpen: true, pageId: null, isAll: true })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Disconnect All
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll flex-1 bg-slate-50/50"
        >
          {facebookPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {facebookPages.map((page) => (
                <div
                  key={page.pageId}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-sm text-slate-800 uppercase tracking-tight line-clamp-1" title={page.pageName}>
                        {page.pageName}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
                        ID: {page.pageId}
                      </p>
                    </div>
                    <button
                      onClick={() => setDisconnectModalState({ isOpen: true, pageId: page.pageId, isAll: false })}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ml-2"
                      title="Remove Page"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-slate-100 mt-auto">
                    <button
                      onClick={() => router.push(`/post-management`)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                    >
                      Manage Page
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <img src="/social-icon/facebook-icon.png" alt="Facebook" className="w-20 h-20 object-contain mb-6" />
              <h3 className="text-black font-black uppercase tracking-tight mb-2 text-lg">
                Meta Ads & Posts
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Connect your Facebook pages to manage all social interactions, schedule posts, and analyze performance from one hub.
              </p>
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/facebook/login?userId=${userId}`;
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105"
              >
                Add Facebook Page ↗
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default FacebookColumn;