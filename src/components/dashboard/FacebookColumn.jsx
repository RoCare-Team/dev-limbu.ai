import React from "react";
import { Facebook, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const FacebookColumn = React.memo(({
  facebookPages,
  setFacebookPages,
  handleDisconnectFacebook,
  handleMetaLogout,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden" style={{ height: "380px" }}>
      <div className="p-6 border-b border-black/5 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg">
              <Facebook className="w-5 h-5 text-yellow-400" />
            </div>
            <h2
              className="font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Facebook
            </h2>
          </div>
          {facebookPages.length > 0 && (
            <span className="text-[10px] bg-black text-yellow-400 font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {facebookPages.length} Pages
            </span>
          )}
        </div>
      </div>

      <div
        className="overflow-y-auto p-6 space-y-4 custom-scroll flex-1"
      >
        {facebookPages.length > 0 ? (
          <>
            {facebookPages.map((page) => (
              <div
                key={page.pageId}
                className="bg-white border border-black/5 rounded-3xl p-5 space-y-4 hover:border-yellow-400 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm text-black uppercase tracking-tight">
                      {page.pageName}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      ID: {page.pageId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDisconnectFacebook(page.pageId)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/post-management`)}
                  className="btn-lemon w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Manage Page
                </button>
              </div>
            ))}

            <div className="pt-4 space-y-3">
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/facebook/login?userId=${userId}`;
                }}
                className="btn-ghost w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" /> Link Another Page
              </button>

              <button
                onClick={handleMetaLogout}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-colors"
              >
                Disconnect Facebook
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-black/5">
              <Facebook className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-black font-black uppercase tracking-tight mb-2">
              Meta Ads & Posts
            </h3>
            <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
              Connect your Facebook pages to manage all social interactions
              from one hub.
            </p>
            <button
              onClick={() => {
                const userId = localStorage.getItem("userId");
                window.location.href = `/api/facebook/login?userId=${userId}`;
              }}
              className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Add Facebook Page ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default FacebookColumn;
