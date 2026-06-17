import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Building2,
  Plus,
  X,
  Phone,
  Globe,
  LayoutDashboard,
  BarChart3,
  LogOut,
} from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import DisconnectProfileModal from "@/components/modals/DisconnectProfileModal";
import { getLocalStorage } from "@/utils/storage";

const GMBColumn = React.memo(
  ({
    summary,
    handleAddProject,
    filterStatus,
    setFilterStatus,
    loading,
    listings,
    getFilteredListings,
    getVerificationBadge,
    handleListingData,
    handleViewPerformanceInsights,
    handleDisconnectGMB,
  }) => {
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] =
      React.useState(false);
    const handleConfirmDisconnect = React.useCallback(async () => {
      if (handleDisconnectGMB) {
        const disconnected = await handleDisconnectGMB();
        if (disconnected) setIsDisconnectModalOpen(false);
        return;
      }

      signOut({ callbackUrl: "/login" });
    }, [handleDisconnectGMB]);

    return (
      <>
        <DisconnectProfileModal
          isOpen={isDisconnectModalOpen}
          onClose={() => setIsDisconnectModalOpen(false)}
          onConfirm={handleConfirmDisconnect}
          platformName="GMB"
          customMessage="Are you sure you want to disconnect your Google Business Profile? This will remove the saved GMB profiles from this dashboard."
        />
        <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden w-full h-[calc(100vh-220px)] min-h-[500px]">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/social-icon/gmb-icon.png"
                  alt="GMB"
                  className="w-8 h-8 object-contain"
                />
                <h2
                  className="font-bold text-lg text-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  GMB Profile
                </h2>
                <span className="ml-2 text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {summary.total} Lists
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Summary / Filter Pills */}
                <div className="flex gap-2 flex-1 md:flex-none">
                  <button
                    onClick={() => setFilterStatus("verified")}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      filterStatus === "verified"
                        ? "bg-black border-black text-yellow-400"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    Verified ({summary.verified})
                  </button>
                  <button
                    onClick={() => setFilterStatus("unverified")}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      filterStatus === "unverified"
                        ? "bg-black border-black text-yellow-400"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    Unverified ({summary.unverified})
                  </button>
                  {filterStatus !== "all" && (
                    <button
                      onClick={() => setFilterStatus("all")}
                      className="w-10 flex items-center justify-center text-slate-400 hover:text-black transition-colors border-2 border-transparent rounded-xl hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {listings && listings.length > 0 && (
                  <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="flex items-center gap-2 px-4 h-10 rounded-xl border-2 border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-colors"
                    title="Disconnect GMB"
                  >
                    <LogOut className="w-4 h-4" />{" "}
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 space-y-4 custom-scroll flex-1 bg-slate-50/50">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <CircularProgress size={30} sx={{ color: "#eab308" }} />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Syncing...
                </p>
              </div>
            )}
            {!loading && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {getFilteredListings(listings).map((listing, i) => (
                  <div
                    key={i}
                    className="group bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 transition-all duration-300 hover:border-yellow-400 hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: Logo + Title + Badge */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {listing.logoUrl ? (
                            <img
                              src={listing.logoUrl}
                              alt="Logo"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-300">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3
                              className="font-bold text-sm text-slate-800 truncate uppercase tracking-tight"
                              title={listing.title}
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              {listing.title}
                            </h3>
                            {getVerificationBadge(listing)}
                          </div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            {listing.categories?.primaryCategory?.displayName ||
                              "Business Profile"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                          <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">
                            {listing.phoneNumbers?.primaryPhone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                          <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          {listing.websiteUri ? (
                            <a
                              href={listing.websiteUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:text-yellow-600 transition-colors"
                            >
                              {listing.websiteUri}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">
                              No Website
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-slate-100 mt-4">
                      <button
                        onClick={() => handleListingData(listing)}
                        disabled={listing.hasVoiceOfMerchant !== true}
                        className="bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> Manage
                      </button>
                      <button
                        onClick={() => handleViewPerformanceInsights(listing)}
                        disabled={listing.hasVoiceOfMerchant !== true}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Insights
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                  <img
                    src="/social-icon/gmb-icon.png"
                    alt="GMB"
                    className="w-20 h-20 object-contain mb-6"
                  />
                  <h3 className="text-black font-black uppercase tracking-tight mb-2">
                    No Profiles Found
                  </h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                    Link your Google Business Profile to start optimizing your
                    digital presence.
                  </p>
                  <button
                    onClick={() => {
                      const userId = getLocalStorage.getItem("userId");
                      signIn("google", {
                        callbackUrl: `/dashboard?userId=${userId}`,
                      });
                    }}
                    className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    Connect Now ↗
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </>
    );
  },
);

export default GMBColumn;
