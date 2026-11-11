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
  RefreshCw,
  CheckCircle2,
  CircleHelp,
} from "lucide-react";
import { startGmbConnect } from "@/hooks/useGmbConnection";
import { toast } from "react-hot-toast";
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
    handleManualRefresh,
    gmbConnected,
    gmbLoading,
    gmbName,
    gmbEmail,
    gmbImage,
  }) => {
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] =
      React.useState(false);
    const [accountImageFailed, setAccountImageFailed] = React.useState(false);
    const profileCount = summary?.total ?? listings?.length ?? 0;
    React.useEffect(() => {
      setAccountImageFailed(false);
    }, [gmbImage]);
    const connectionLabel = gmbLoading
      ? "Checking connection"
      : gmbConnected
        ? "Connected"
        : "Not connected";
    const overviewActionLabel = gmbConnected
      ? loading
        ? "Refreshing profiles"
        : profileCount > 0
          ? "Refresh profiles"
          : "Find profiles"
      : "Connect Google";
    const handleOverviewAction = React.useCallback(async () => {
      if (gmbConnected) {
        await handleManualRefresh?.();
        return;
      }

      try {
        await startGmbConnect("/dashboard");
      } catch (err) {
        toast.error(err.message);
      }
    }, [gmbConnected, handleManualRefresh]);
    // Pehle fallback me `signOut()` tha — GMB disconnect karne par user app se
    // hi logout ho jata tha. Ab disconnect sirf GMB connection hataata hai.
    const handleConfirmDisconnect = React.useCallback(async () => {
      const disconnected = await handleDisconnectGMB?.();
      if (disconnected !== false) setIsDisconnectModalOpen(false);
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
        <div className="w-full min-w-0 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-md">
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
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Summary / Filter Pills */}
                <div className="flex gap-2 flex-1 md:flex-none">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("verified")}
                    aria-pressed={filterStatus === "verified"}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      filterStatus === "verified"
                        ? "bg-black border-black text-yellow-400"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2`}
                  >
                    Verified ({summary.verified})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("unverified")}
                    aria-pressed={filterStatus === "unverified"}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      filterStatus === "unverified"
                        ? "bg-black border-black text-yellow-400"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2`}
                  >
                    Unverified ({summary.unverified})
                  </button>
                  {filterStatus !== "all" && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus("all")}
                      aria-label="Clear verification filter"
                      className="w-10 flex items-center justify-center text-slate-400 hover:text-black transition-colors border-2 border-transparent rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {gmbConnected && (
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
          <div className="space-y-4 bg-slate-50/50 p-3 sm:p-4">
            <section
              aria-labelledby="gmb-overview-heading"
              className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]"
            >
              <div className="relative flex min-w-0 flex-col justify-between gap-5 bg-white p-5 sm:p-6">
                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Google Business Profile
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        gmbLoading
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : gmbConnected
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          gmbLoading
                            ? "bg-amber-500"
                            : gmbConnected
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                        }`}
                      />
                      {connectionLabel}
                    </span>
                  </div>

                  <div className="flex min-w-0 items-center gap-3">
                    {gmbConnected && gmbImage && !accountImageFailed ? (
                      <img
                        src={gmbImage}
                        alt=""
                        onError={() => setAccountImageFailed(true)}
                        className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          src="/social-icon/gmb-icon.png"
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3
                        id="gmb-overview-heading"
                        className="truncate text-base font-bold tracking-tight text-slate-900"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {gmbConnected
                          ? gmbName || "Google account connected"
                          : gmbLoading
                            ? "Checking Google account"
                            : "Connect a Google account"}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {gmbConnected
                          ? gmbEmail || "Google account details unavailable"
                          : gmbLoading
                            ? "Connection status is being checked"
                            : "Connect to manage your Business Profiles"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOverviewAction}
                    disabled={gmbLoading || (gmbConnected && loading)}
                    className="mt-5 inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {gmbConnected ? (
                      <RefreshCw className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {overviewActionLabel}
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-6 lg:border-l lg:border-t-0">
                <div className="mb-5 flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                      Profile health
                    </h3>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      Verification across your business locations
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {loading ? "Updating" : `${profileCount} total`}
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-3">
                  <div className="flex min-w-0 flex-col border-l-2 border-slate-300 pl-3 sm:pl-4">
                    <dt className="order-2 mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                      Profiles
                    </dt>
                    <dd className="order-1 text-3xl font-bold leading-none tracking-tight text-slate-900 sm:text-4xl">
                      {loading ? "—" : profileCount}
                    </dd>
                  </div>
                  <div className="flex min-w-0 flex-col border-l-2 border-emerald-500 pl-3 sm:pl-4">
                    <dt className="order-2 mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      Verified
                    </dt>
                    <dd className="order-1 text-3xl font-bold leading-none tracking-tight text-slate-900 sm:text-4xl">
                      {loading ? "—" : summary?.verified ?? 0}
                    </dd>
                  </div>
                  <div className="flex min-w-0 flex-col border-l-2 border-amber-500 pl-3 sm:pl-4">
                    <dt className="order-2 mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                      <CircleHelp className="h-3 w-3 shrink-0" />
                      Unverified
                    </dt>
                    <dd className="order-1 text-3xl font-bold leading-none tracking-tight text-slate-900 sm:text-4xl">
                      {loading ? "—" : summary?.unverified ?? 0}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

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
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <img
                    src="/social-icon/gmb-icon.png"
                    alt="GMB"
                    className="w-20 h-20 object-contain mb-6"
                  />
                  <h3 className="text-black font-black uppercase tracking-tight mb-2">
                    {gmbConnected
                      ? "No Business Profiles Found"
                      : "Google Account Not Connected"}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                    {gmbConnected
                      ? "Your Google account is connected, but it has no business profiles available yet. Refresh profiles from the account overview to check again."
                      : "Connect your Google account from the overview above to find and manage your Business Profiles."}
                  </p>
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
