import React from "react";
import { Instagram, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const InstagramColumn = React.memo(({
  instagramPages,
  setInstagramPages,
  handleDisconnectInstagram,
  handleMetaLogout,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden" style={{ height: "420px" }}>
      <div className="p-4 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg">
              <Instagram className="w-4 h-4 text-yellow-400" />
            </div>
            <h2
              className="font-bold text-sm text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Instagram
            </h2>
          </div>
          {instagramPages.length > 0 && (
            <span className="text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {instagramPages.length} Profiles
            </span>
          )}
        </div>
      </div>

      <div
        className="overflow-y-auto p-4 space-y-4 custom-scroll flex-1 bg-slate-50/50"
      >
        {instagramPages.length > 0 ? (
          <>
            {instagramPages.map((page) => (
              <div
                key={page.igId}
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 hover:border-yellow-400 hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-slate-800 uppercase tracking-tight">
                      @{page.igUsername}
                    </p>
                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                      IGID: {page.igId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDisconnectInstagram(page.igId)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    router.push(`/post-management?pageId=${page.igId}`)
                  }
                  className="bg-yellow-400 hover:bg-yellow-500 text-black w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  Manage Page
                </button>
              </div>
            ))}

            <div className="pt-3 space-y-3 border-t-2 border-slate-200/50">
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/instagram/login?userId=${userId}`;
                }}
                className="bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Another Page
              </button>

              <button
                onClick={handleMetaLogout}
                className="w-full py-1.5 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
              >
                Disconnect Instagram
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mb-6 border border-slate-200">
              <Instagram className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-bold uppercase tracking-tight mb-2 text-sm">
              Visual Marketing
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">
              Connect your business Instagram to automate posts and track
              engagement trends.
            </p>
            <button
              onClick={() => {
                const userId = localStorage.getItem("userId");
                window.location.href = `/api/instagram/login?userId=${userId}`;
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black w-full py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              Link Instagram ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default InstagramColumn;
