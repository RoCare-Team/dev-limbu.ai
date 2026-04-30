import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Building2, Plus, X, Phone, Globe, LayoutDashboard, BarChart3 } from "lucide-react";
import { signIn } from "next-auth/react";

const GMBColumn = React.memo(({
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
}) => {
  console.log("Rendering GMBColumn",listings);
  return (
    <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1" style={{ height: "420px" }}>
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg">
              <Building2 className="w-4 h-4 text-yellow-400" />
            </div>
            <h2
              className="font-bold text-sm text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              GMB Profile
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {summary.total} Lists
            </span>
            <button
              onClick={handleAddProject}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-black hover:scale-110 transition-transform"
              title="Add Account"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary / Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("verified")}
            className={`flex-1 py-1.5 px-3 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${filterStatus === "verified"
              ? "bg-black border-black text-yellow-400"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
          >
            Verified ({summary.verified})
          </button>
          <button
            onClick={() => setFilterStatus("unverified")}
            className={`flex-1 py-1.5 px-3 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${filterStatus === "unverified"
              ? "bg-black border-black text-yellow-400"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
          >
            Issues ({summary.unverified})
          </button>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="w-8 flex items-center justify-center text-slate-400 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="overflow-y-auto p-4 space-y-4 custom-scroll flex-1 bg-slate-50/50"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <CircularProgress size={30} sx={{ color: "#eab308" }} />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Syncing...
            </p>
          </div>
        )}
        {!loading && listings.length > 0 ? (
          getFilteredListings(listings).map((listing, i) => (
            
            <div
              key={i}
              className="group bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 transition-all duration-300 hover:border-yellow-400 hover:shadow-md"
            >
              {/* Header: Logo + Title + Badge */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {listing.logoUrl ? (
                    <img
                      src={listing.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-300">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-0.5">
                    <h3
                      className="font-bold text-xs text-slate-800 truncate uppercase tracking-tight"
                      title={listing.title}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {listing.title}
                    </h3>
                    {getVerificationBadge(listing)}
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
                    {listing.categories?.primaryCategory?.displayName || "Business Profile"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400">
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className="truncate">
                    {listing.phoneNumbers?.primaryPhone || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400">
                    <Globe className="w-3 h-3" />
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
                    <span className="text-slate-400 italic">No Website</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-slate-100">
                <button
                  onClick={() => handleListingData(listing)}
                  disabled={listing.hasVoiceOfMerchant !== true}
                  className="bg-white border border-slate-200 hover:bg-slate-50 py-2 rounded-lg text-[9px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <LayoutDashboard className="w-3 h-3" /> Manage
                </button>
                <button
                  onClick={() => handleViewPerformanceInsights(listing)}
                  disabled={listing.hasVoiceOfMerchant !== true}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <BarChart3 className="w-3 h-3" /> Insights
                </button>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-black/5">
                <Building2 className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-black font-black uppercase tracking-tight mb-2">
                No Profiles Found
              </h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                Link your Google Business Profile to start optimizing your digital presence.
              </p>
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="btn-lemon w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Connect Now ↗
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
});

export default GMBColumn;