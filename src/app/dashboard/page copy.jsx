"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";
import {
  MapPin,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Building2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- API Helpers ---
export async function fetchGMBAccounts(accessToken) {
  try {
    const res = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch accounts: ${errText}`);
    }

    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error("Fetch Accounts Error:", err);
    toast.error("Error fetching GMB accounts!");
    return [];
  }
}

export async function fetchAllLocationsByAccount(accessToken, accountId) {
  try {
    let allLocations = [];
    let pageToken = null;

    do {
      let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error(`Failed to fetch locations for account ${accountId}`);

      const data = await res.json();
      
      if (data.locations && data.locations.length > 0) {
        allLocations = [...allLocations, ...data.locations];
      }
      
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allLocations;
  } catch (err) {
    console.error(`Error fetching locations for account ${accountId}:`, err);
    return [];
  }
}

export async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const res = await fetch(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      console.error(`Failed to check VoM for ${locationName}`);
      return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Error checking VoM for ${locationName}:`, err);
    return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
  }
}

// --- Main Dashboard Component ---
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, verified: 0, unverified: 0, pending: 0 });
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "verified", "unverified"

  const userPlan = session?.user?.plan || "";
  const maxAccounts = userPlan === "" ? 1 : 0;

  // --- Fetch All Accounts & Locations ---
  const fetchInitialData = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    const token = session.accessToken;

    const accountsData = await fetchGMBAccounts(token);
    if (accountsData.length === 0) {
      setAccounts([]);
      toast.info("No accounts found. Please add your project!");
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    // Fetch ALL locations at once
    const accountId = accountsData[0].name.replace("accounts/", "");
    const allLocations = await fetchAllLocationsByAccount(token, accountId);

    if (allLocations.length > 0) {
      // Check Voice of Merchant for each location
      const locationsWithVoM = await Promise.all(
        allLocations.map(async (loc) => {
          const vomStatus = await checkVoiceOfMerchant(token, loc.name);
          return {
            ...loc,
            accountId,
            accountName: accountsData[0].accountName || accountsData[0].name,
            hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
            hasBusinessAuthority: vomStatus.hasBusinessAuthority,
          };
        })
      );

      setAccounts([{ email: session.user.email, listings: locationsWithVoM }]);
    } else {
      setAccounts([]);
    }

    setInitialFetchDone(true);
    setLoading(false);
  };

  useEffect(() => {
    if (session && !initialFetchDone) {
      fetchInitialData();
    }
  }, [session, initialFetchDone]);

  const handleListingData = (listing) => {
    
    const dataToSend = {
      locality: listing?.storefrontAddress?.locality || "",
      website: listing?.websiteUri || "",
    };

    localStorage.setItem("listingData", JSON.stringify(dataToSend));
    localStorage.setItem("accountId", listing.accountId);

    router.push(`/post-management/${listing.name}`);
  };

  // --- Summary Update ---
  useEffect(() => {
    if (accounts.length > 0) {
      const allListings = accounts.flatMap((acc) => acc.listings);
      
      const locationDetails = allListings.map(item => {
        const locationId = item.name.split("/")[1];
        const accountId = item.accountId || "";
        const locality = item.storefrontAddress?.locality || "";
        const address = item.storefrontAddress?.addressLines?.[0] || "";
        const title = item.title || "";

        return { locationId, accountId, locality, address, title };
      });

      localStorage.setItem("locationDetails", JSON.stringify(locationDetails));

      const total = allListings.length;
      const verified = allListings.filter((l) => l.hasVoiceOfMerchant === true).length;
      const unverified = allListings.filter((l) => l.hasVoiceOfMerchant === false).length;
      const pending = 0; // Can be calculated based on other criteria if needed
      setSummary({ total, verified, unverified, pending });
    }
  }, [accounts]);

  // --- Add Project ---
  const handleAddProject = async () => {
    if (!session) {
      await signIn("google", { redirect: false });
      return;
    }

    if (accounts.length >= maxAccounts) {
      toast.error(`⚠️ ${userPlan} plan allows only ${maxAccounts} profiles. Upgrade to add more!`);
      return;
    }

    await fetchInitialData();
  };

  // --- Verification Badge ---
  const getVerificationBadge = (listing) => {
    const isVerified = listing.hasVoiceOfMerchant === true;

    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 whitespace-nowrap">
          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
          <span className="hidden sm:inline">Verified</span>
          <span className="sm:hidden">✓</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200 whitespace-nowrap">
          <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
          <span className="hidden sm:inline">Unverified</span>
          <span className="sm:hidden">✗</span>
        </span>
      );
    }
  };

  // --- Filter Listings ---
  const getFilteredListings = (listings) => {
    if (filterStatus === "verified") {
      return listings.filter((l) => l.hasVoiceOfMerchant === true);
    } else if (filterStatus === "unverified") {
      return listings.filter((l) => l.hasVoiceOfMerchant === false);
    }
    return listings; // "all"
  };

  // --- Loading State ---
  if (status === "loading" || (loading && !initialFetchDone)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="text-center flex flex-col items-center justify-center">
          <CircularProgress size={60} thickness={4} sx={{ color: "#3b82f6" }} />
          <p className="text-gray-700 font-semibold mt-6 text-base sm:text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mt-12 sm:mt-14">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                AI GMB Auto Management
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base truncate">Welcome back, {session?.user?.name || "User"} 👋</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 justify-end sm:justify-start">
              {session && (
                <button
                  onClick={() => signOut({ callbackUrl: "/dashboard" })}
                  className="bg-lightPrimary text-dark font-semibold px-3 sm:px-5 py-2 rounded-lg sm:rounded-xl shadow-md hover:from-lightPrimary hover:to-dark transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
                >
                  Logout
                </button>
              )}

              {accounts.length < maxAccounts && (
                <button
                  onClick={handleAddProject}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base whitespace-nowrap"
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Add Project</span>
                      <span className="xs:hidden">Add</span>
                      <span className="text-xs bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        {accounts.length}/{maxAccounts}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Summary Cards */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div 
              onClick={() => setFilterStatus("all")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-blue-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "all" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Total Listings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.total}</p>
                </div>
                <Building2 className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("verified")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-green-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "verified" ? "ring-2 ring-green-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Verified</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.verified}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-10 sm:h-10 text-green-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("unverified")}
              className={`bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-lg ${
                filterStatus === "unverified" ? "ring-2 ring-red-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Unverified</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.unverified}</p>
                </div>
                <XCircle className="w-6 h-6 sm:w-10 sm:h-10 text-red-500 opacity-80 hidden sm:block" />
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 border-l-4 border-yellow-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{summary.pending}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-500 opacity-80 hidden sm:block" />
              </div>
            </div>
          </div>
        )}

        {/* Listings or Empty State */}
        {accounts.length === 0 && !loading ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No Listings Found</h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              {initialFetchDone
                ? "No Google Business Profiles found. Add your project from Google Business Profile Manager."
                : "Connect your Google Business Profile to get started."}
            </p>
            {!session && (
              <button
                onClick={() => signIn("google", { redirect: false })}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm sm:text-base"
              >
                Sign in with Google
              </button>
            )}
          </div>
        ) : (
          accounts.map((acc, idx) => {
            const filteredListings = getFilteredListings(acc.listings);
            
            return (
              <div key={idx} className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl sm:rounded-t-2xl px-4 sm:px-6 py-3 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-lg">
                  <h2 className="text-base sm:text-xl font-bold truncate">{acc.email}</h2>
                  <span className="text-xs sm:text-sm bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold backdrop-blur-sm whitespace-nowrap self-start sm:self-auto">
                    {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
                    {filterStatus !== "all" && ` (${filterStatus})`}
                  </span>
                </div>

                {filteredListings.length === 0 ? (
                  <div className="bg-white rounded-b-xl sm:rounded-b-2xl shadow-lg p-8 sm:p-12 text-center">
                    <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">No {filterStatus} listings found</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Try selecting a different filter above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
                    {filteredListings.map((listing, i) => (
                  <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200">
                    <div className="p-4 sm:p-6">
                      {/* Header Section */}
                      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                            {listing.title || listing.name || "Unnamed Listing"}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2 truncate">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{listing.categories?.primaryCategory?.displayName || "Uncategorized"}</span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getVerificationBadge(listing)}
                        </div>
                      </div>

                      {/* Business Details */}
                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-2.5 sm:p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">Phone</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">{listing.phoneNumbers?.primaryPhone || "N/A"}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-2.5 sm:p-3 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">Website</span>
                          </div>
                          <Link
                            href={listing.websiteUri || "#"}
                            className="text-xs sm:text-sm text-gray-900 font-medium truncate block hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {listing.websiteUri || "N/A"}
                          </Link>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-2.5 sm:p-3 rounded-lg border border-green-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">Address</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-900 font-medium line-clamp-2">
                            {listing.storefrontAddress?.addressLines?.join(", ") || "N/A"}
                            {listing.storefrontAddress?.locality && `, ${listing.storefrontAddress.locality}`}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleListingData(listing)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 sm:gap-2"
                      >
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Manage This Listing
                      </button>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}