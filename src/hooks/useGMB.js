import { getLocalStorage, getSessionStorage, removeSessionStorage, setSessionStorage } from "@/utils/storage";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Helpers with Retry & Error Handling ---
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const res = await fetch(url, options);
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error: ${res.status} ${errText}`);
    }
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

async function fetchGMBAccounts(accessToken) {
  const data = await fetchWithRetry(
    "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data.accounts || [];
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  let allLocations = [];
  let pageToken = null;
  do {
    let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const data = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (data.locations) allLocations = [...allLocations, ...data.locations];
    pageToken = data.nextPageToken || null;
    if (pageToken) await sleep(200);
  } while (pageToken);
  return allLocations;
}

async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    return await fetchWithRetry(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      2
    );
  } catch (err) {
    return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
  }
}

async function fetchLocationLogo(accessToken, locationName) {
  try {
    const data = await fetchWithRetry(
      `https://mybusiness.googleapis.com/v4/${locationName}/media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      1
    );
    if (data.mediaItems?.length > 0) {
      const item = data.mediaItems.find(i => i.locationAssociation?.category === 'LOGO') ||
        data.mediaItems.find(i => i.locationAssociation?.category === 'PROFILE') ||
        data.mediaItems[0];
      return item?.thumbnailUrl || item?.googleUrl || null;
    }
    return null;
  } catch (err) { return null; }
}

async function storeUserListingsForAdmin(userEmail, listings) {
  try {
    await fetch('/api/admin/saveBussiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, listings }),
    });
  } catch (error) { console.error('Error storing listings:', error); }
}

const CACHE_EXPIRY_MS = 10 * 60 * 1000;
const getCacheKey = (email) => `gmb_data_${email}`;

// --- Main Hook ---
export function useGMB(session, status, setUiState) {
  const [accounts, setAccounts] = useState([]);      // Live Google Data
  const [listings, setListings] = useState([]);      // Database Listings (Impersonation)
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);

  const fetchInProgress = useRef(false);

  // 1. Fetch from Database (Handles both Impersonation and Normal Fallback)
  const fetchAdminListings = useCallback(async () => {
    const isImpersonating = getLocalStorage("isImpersonating") === "true";

    // Same Logic as old dashboard.js
    const token = isImpersonating ? getLocalStorage("userToken") : getLocalStorage("adminToken");
    const email = isImpersonating ? getLocalStorage("impersonatedEmail") : session?.user?.email;

    if (!token || !email) return;

    try {
      const res = await fetch(
        `/api/admin/saveBussiness?userEmail=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 404) {
        setListings([]);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Error fetching database listings:", error);
    }
  }, [session?.user?.email]);

  // 2. Live Google Fetch (Available for all authenticated users)
  const fetchInitialData = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!session?.accessToken || !session?.user?.email) {
      if (status === "authenticated") setUiState(prev => ({ ...prev, isSessionExpired: true }));
      return;
    }

    const userEmail = session.user.email;
    const cacheKey = getCacheKey(userEmail);

    // Cache check
    if (!forceRefresh) {
      const cached = JSON.parse(getSessionStorage(cacheKey) || null);
      if (cached?.timestamp && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
        setAccounts(cached.accounts);
        setNoAccountsFound(cached.noAccountsFound);
        setInitialFetchDone(true);
        return;
      }
    }

    if (fetchInProgress.current && !forceRefresh) return;
    fetchInProgress.current = true;
    if (!isBackground) setLoading(true);

    try {
      const token = session.accessToken;
      const accountsData = await fetchGMBAccounts(token);

      if (accountsData.length === 0) {
        setAccounts([]);
        setNoAccountsFound(true);
      } else {
        const listingsPromises = accountsData.map(async (account) => {
          const accountId = account.name.replace("accounts/", "");
          try {
            const locations = await fetchAllLocationsByAccount(token, accountId);
            return await Promise.all(locations.map(async (loc) => {
              const vom = await checkVoiceOfMerchant(token, loc.name);
              const logo = await fetchLocationLogo(token, `accounts/${accountId}/${loc.name}`);
              return {
                ...loc,
                accountId,
                hasVoiceOfMerchant: vom.hasVoiceOfMerchant,
                verified: vom.hasVoiceOfMerchant, // sync for legacy components
                logoUrl: logo
              };
            }));
          } catch (e) { return []; }
        });

        const allListings = (await Promise.all(listingsPromises)).flat();
        const finalData = [{ email: userEmail, listings: allListings }];

        setAccounts(finalData);
        setNoAccountsFound(allListings.length === 0);

        // Update Cache
        setSessionStorage(cacheKey, JSON.stringify({
          accounts: finalData,
          noAccountsFound: allListings.length === 0,
          timestamp: Date.now()
        }));

        // Sync to Admin Database
        if (allListings.length > 0) await storeUserListingsForAdmin(userEmail, allListings);
      }
    } catch (error) {
      console.error("❌ Live Fetch Error:", error);
      if (error.message.includes("401") || error.message.includes("403")) {
        setUiState(prev => ({ ...prev, isSessionExpired: true }));
      }
    } finally {
      setInitialFetchDone(true);
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [session, status, setUiState]);

  // Orchestration: Fetch DB hamesha, Google Live agar session hai toh hamesha
  useEffect(() => {
    fetchAdminListings();

    if (session?.user?.email && status === "authenticated" && !initialFetchDone) {
      fetchInitialData();
    }
  }, [session?.user?.email, status, initialFetchDone, fetchAdminListings, fetchInitialData]);

  // Priority Logic for UI: Live Data > Database Data
  const activeListings = useMemo(() => {
    // If Live Google Data exists, it takes priority
    if (accounts.length > 0) {
      return accounts.flatMap(acc => acc.listings);
    }
    // Otherwise fallback to Database (essential for impersonation)
    return listings;
  }, [accounts, listings]);

  // Derive Summary Statistics
  const summary = useMemo(() => {
    const total = activeListings.length;
    // Check both potential verification property names
    const verifiedCount = activeListings.filter(l =>
      l.hasVoiceOfMerchant === true || l.verified === true
    ).length;

    return {
      total,
      verified: verifiedCount,
      unverified: total - verifiedCount,
      pending: 0
    };
  }, [activeListings]);

  // Manual Refresh Handler
  const handleManualRefresh = useCallback(async () => {
    const isImpersonating = getLocalStorage("isImpersonating") === "true";

    if (isImpersonating) {
      toast.success("Refreshing from database...");
      await fetchAdminListings();
    }

    // Always try to refresh live data if session exists
    if (session?.user?.email) {
      removeSessionStorage(getCacheKey(session.user.email));
      await fetchInitialData(true);
    }
  }, [session?.user?.email, fetchAdminListings, fetchInitialData]);

  return {
    accounts,
    loading,
    initialFetchDone,
    noAccountsFound,
    listings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh
  };
}