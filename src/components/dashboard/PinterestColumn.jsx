import React, { useState } from "react";
import { LogOut, Plus, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import DisconnectProfileModal from "@/components/modals/DisconnectProfileModal";

const PinterestColumn = React.memo(({
  pinterestProfiles,
  setPinterestProfiles,
  handleDisconnectPinterest,
}) => {
  const router = useRouter();

  const [disconnectModalState, setDisconnectModalState] = useState({
    isOpen: false,
    profileId: null,
  });

  const confirmDisconnect = () => {
    if (disconnectModalState.profileId) {
      handleDisconnectPinterest(disconnectModalState.profileId);
    }
    setDisconnectModalState({ isOpen: false, profileId: null });
  };

  return (
    <>
      <DisconnectProfileModal 
        isOpen={disconnectModalState.isOpen}
        onClose={() => setDisconnectModalState({ isOpen: false, profileId: null })}
        onConfirm={confirmDisconnect}
        platformName="Pinterest Profile"
        customMessage="Are you sure you want to disconnect this Pinterest profile? This will remove access to all associated boards and pins."
      />
      <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden w-full h-[calc(100vh-220px)] min-h-[500px]">
        <div className="p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/social-icon/pinterest-icon.png" alt="Pinterest" className="w-8 h-8 object-contain" />
              <h2
                className="font-bold text-lg text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Pinterest Profiles
              </h2>
              {pinterestProfiles?.length > 0 && (
                <span className="ml-2 text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {pinterestProfiles.length} Profiles
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {pinterestProfiles?.length > 0 && (
                 <button
                   onClick={() => {
                     const userId = localStorage.getItem("userId");
                     window.location.href = `/api/pinterest/login?userId=${userId}`;
                   }}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold text-[10px] uppercase tracking-wider hover:bg-yellow-500 transition-colors shadow-sm"
                 >
                   <Plus className="w-4 h-4" /> Add Profile
                 </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll flex-1 bg-slate-50/50"
        >
          {pinterestProfiles?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {pinterestProfiles.map((profile) => (
                <div
                  key={profile.pinterestUserId}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {profile.profileImage ? (
                           <img src={profile.profileImage} alt={profile.username} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                             <span className="font-bold text-slate-500 text-lg">{profile.username?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-slate-800 uppercase tracking-tight line-clamp-1" title={profile.username}>
                            @{profile.username}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
                            {profile.accountType === 'BUSINESS' ? 'Business Account' : 'Personal Account'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDisconnectModalState({ isOpen: true, profileId: profile.pinterestUserId })}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ml-2"
                        title="Remove Profile"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-4 mt-2">
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-800">{profile.boards?.length || 0}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Boards</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-800">
                             {profile.boards?.reduce((total, board) => total + (board.pins?.length || 0), 0) || 0}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Total Pins</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-slate-100 mt-auto">
                    <button
                      onClick={() => router.push(`/post-management`)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Create Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <img src="/social-icon/pinterest-icon.png" alt="Pinterest" className="w-20 h-20 object-contain mb-6" />
              <h3 className="text-black font-black uppercase tracking-tight mb-2 text-lg">
                Visual Discovery
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Connect your Pinterest profile to automate pinning, organize boards, and drive traffic directly from your dashboard.
              </p>
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/pinterest/login?userId=${userId}`;
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105"
              >
                Add Pinterest Profile ↗
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default PinterestColumn;