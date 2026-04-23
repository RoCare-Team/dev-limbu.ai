import { getLocalStorage, getSessionStorage, removeSessionStorage, setSessionStorage } from "@/utils/storage";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

// --- Utility for sleep/delay ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Helpers with Retry Logic ---
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const res = await fetch(url, options);
    
    // If rate limited (429) or server error (5xx), retry
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
  try {
    const data = await fetchWithRetry(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.accounts || [];
  } catch (err) {
    console.error("Fetch Accounts Error:", err);
    throw err;
  }
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  try {
    let allLocations = [];
    let pageToken = null;
    do {
      let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      
      const data = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (data.locations && data.locations.length > 0) {
        allLocations = [...allLocations, ...data.locations];
      }
      pageToken = data.nextPageToken || null;
      
      // Small delay between pages if paginating
      if (pageToken) await sleep(200);
    } while (pageToken);
    return allLocations;
  } catch (err) {
    console.error(`Error fetching locations for account ${accountId}:`, err);
    throw err;
  }
}

async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const data = await fetchWithRetry(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      2 // Lower retries for status checks
    );
    return data;
  } catch (err) {
    return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
  }
}

async function fetchLocationLogo(accessToken, locationName) {
  try {
    const data = await fetchWithRetry(
      `https://mybusiness.googleapis.com/v4/${locationName}/media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      1 // Minimal retries for media
    );
    if (data.mediaItems && data.mediaItems.length > 0) {
      const item =
        data.mediaItems.find((i) => i.locationAssociation?.category === "LOGO") ||
        data.mediaItems.find((i) => i.locationAssociation?.category === "PROFILE") ||
        data.mediaItems[0];
      return item?.thumbnailUrl || item?.googleUrl || null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function storeUserListingsForAdmin(userEmail, listings) {
  try {
    await fetch("/api/admin/saveBussiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, listings }),
    });
  } catch (error) {
    console.error("Error storing listings for admin:", error);
  }
}

const CACHE_EXPIRY_MS = 10 * 60 * 1000;
const getCacheKey = (email) => `gmb_data_${email}`;

export function useGMB(session, status, setUiState) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);
  const [cacheStatus, setCacheStatus] = useState("");
  const [listings, setListings] = useState([]);
  
  const fetchInProgress = useRef(false);

  const saveToCache = useCallback((email, accountsData, noAccounts) => {
    const cacheKey = getCacheKey(email);
    const cacheData = {
      accounts: accountsData,
      noAccountsFound: noAccounts,
      timestamp: Date.now(),
    };
    setSessionStorage(cacheKey, JSON.stringify(cacheData));
    setCacheStatus("Data refreshed and cached");
  }, []);

  const loadFromCache = useCallback((email) => {
    const cacheKey = getCacheKey(email);
    const cachedString = getSessionStorage(cacheKey);
    const cached = cachedString ? JSON.parse(cachedString) : null;
    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      const ageMinutes = Math.round(age / 60000);
      if (age < CACHE_EXPIRY_MS) {
        setAccounts(cached.accounts || []);
        setNoAccountsFound(cached.noAccountsFound || false);
        setInitialFetchDone(true);
        setCacheStatus(`Loaded from cache (${ageMinutes} min ago)`);
        return { loaded: true, needsRefresh: age > 5 * 60 * 1000 };
      }
    }
    return { loaded: false, needsRefresh: false };
  }, []);

  const clearCache = useCallback(() => {
    if (session?.user?.email) {
      removeSessionStorage(getCacheKey(session.user.email));
      setCacheStatus("Cache cleared");
    }
  }, [session?.user?.email]);

  const fetchInitialData = useCallback(
    async (forceRefresh = false, isBackground = false) => {
      if (!session?.accessToken || !session?.user?.email || session?.error === "RefreshAccessTokenError") {
        if (status === "authenticated") setUiState((prev) => ({ ...prev, isSessionExpired: true }));
        return;
      }

      const userEmail = session.user.email;
      if (!forceRefresh) {
        const { loaded, needsRefresh } = loadFromCache(userEmail);
        if (loaded) {
          if (needsRefresh) setTimeout(() => fetchInitialData(true, true), 1000);
          return;
        }
      }

      if (fetchInProgress.current && !forceRefresh) return;

      fetchInProgress.current = true;
      if (!isBackground) setLoading(true);
      setNoAccountsFound(false);
      if (!isBackground) setCacheStatus("Fetching fresh data from Google...");

      try {
        const token = session.accessToken;
        const accountsData = await fetchGMBAccounts(token);

        if (accountsData.length === 0) {
          setAccounts([]);
          setNoAccountsFound(true);
          saveToCache(userEmail, [], true);
          setInitialFetchDone(true);
          if (!isBackground) setLoading(false);
          fetchInProgress.current = false;
          setCacheStatus("No accounts found");
          return;
        }

        const listingsPromises = accountsData.map(async (account) => {
          const accountId = account.name.replace("accounts/", "");
          const accountName = account.accountName;
          try {
            const locations = await fetchAllLocationsByAccount(token, accountId);
            if (locations && locations.length > 0) {
              return await Promise.all(
                locations.map(async (loc) => {
                  const vomStatus = await checkVoiceOfMerchant(token, loc.name);
                  const logoUrl = await fetchLocationLogo(token, `accounts/${accountId}/${loc.name}`);
                  return {
                    ...loc,
                    accountId,
                    accountName: accountName || account.name,
                    hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
                    hasBusinessAuthority: vomStatus.hasBusinessAuthority,
                    logoUrl,
                  };
                }),
              );
            }
          } catch (err) {
            console.error(`Error fetching locations for account ${accountName}:`, err);
          }
          return [];
        });

        const results = await Promise.all(listingsPromises);
        const allListings = results.flat();

        if (allListings.length > 0) {
          const newAccounts = [{ email: userEmail, listings: allListings }];
          setAccounts(newAccounts);
          setNoAccountsFound(false);
          saveToCache(userEmail, newAccounts, false);
          await storeUserListingsForAdmin(userEmail, allListings);
          setCacheStatus(`${allListings.length} listings loaded and cached`);
        } else {
          setAccounts([]);
          setNoAccountsFound(true);
          saveToCache(userEmail, [], true);
          setCacheStatus("No listings found");
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        if (error.message.includes("401") || error.message.includes("403")) {
          setUiState((prev) => ({ ...prev, isSessionExpired: true }));
        }
        if (!isBackground) setNoAccountsFound(true);
        setCacheStatus("Error fetching data");
      }

      setInitialFetchDone(true);
      if (!isBackground) setLoading(false);
      fetchInProgress.current = false;
    },
    [session, status, setUiState, loadFromCache, saveToCache]
  );

  const fetchAdminListings = useCallback(async () => {
    const token =
      getLocalStorage("isImpersonating") === "true"
        ? getLocalStorage("userToken")
        : getLocalStorage("adminToken");

    if (!token) return;
    try {
      const res = await fetch("/api/admin/saveBussiness", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Error fetching admin listings:", error);
    }
  }, []);

  useEffect(() => {
    fetchAdminListings();
  }, [fetchAdminListings]);

  useEffect(() => {
    if (session?.user?.email && status === "authenticated" && !initialFetchDone && !fetchInProgress.current) {
      fetchInitialData();
    }
  }, [session?.user?.email, status, initialFetchDone, fetchInitialData]);

  const activeListings = useMemo(() => {
    if (listings.length > 0) return listings;
    if (accounts.length > 0) return accounts.flatMap((acc) => acc.listings);
    return [];
  }, [listings, accounts]);

  const summary = useMemo(() => {
    return {
      total: activeListings.length,
      verified: activeListings.filter((l) => l.hasVoiceOfMerchant === true).length,
      unverified: activeListings.filter((l) => l.hasVoiceOfMerchant === false).length,
      pending: 0,
    };
  }, [activeListings]);

  const handleManualRefresh = useCallback(async () => {
    if (!session?.accessToken) {
      toast.error("Please sign in first");
      return;
    }
    toast.success("Refreshing data...", { duration: 1000 });
    clearCache();
    await fetchInitialData(true);
  }, [session, clearCache, fetchInitialData]);

  return {
    accounts,
    loading,
    initialFetchDone,
    noAccountsFound,
    cacheStatus,
    listings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh,
    clearCache
  };
}
