import { getLocalStorage, getSessionStorage, removeSessionStorage, setSessionStorage } from "@/utils/storage";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

const CACHE_EXPIRY_MS = 10 * 60 * 1000;
const getCacheKey = (email) => `gmb_data_${email}`;

async function storeUserListingsForAdmin(userEmail, listings) {
  try {
    await fetch('/api/admin/saveBussiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, listings }),
    });
  } catch (error) { console.error('Error storing listings:', error); }
}

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

  // 2. Live Backend Fetch (Secure, bypasses browser CORS & Ad-blockers)
  const fetchInitialData = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!session?.user?.email) {
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
      // SECURE CALL: We now ask our own backend to fetch Google data.
      // Next.js backend will handle the exact fresh token securely.
      const res = await fetch("/api/gmb/dashboard-live");
      
      if (res.status === 401 || res.status === 403) {
        throw new Error("Unauthorized - Session expired");
      }

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      const finalData = data.accounts || [];
      const allListings = finalData.length > 0 ? finalData[0].listings : [];

      setAccounts(finalData);
      setNoAccountsFound(data.noAccountsFound);

      // Update Cache
      setSessionStorage(cacheKey, JSON.stringify({
        accounts: finalData,
        noAccountsFound: data.noAccountsFound,
        timestamp: Date.now()
      }));

      // Sync to Admin Database
      if (allListings.length > 0) await storeUserListingsForAdmin(userEmail, allListings);

    } catch (error) {
      console.error("❌ Live Fetch Error:", error);
      if (error.message.includes("Unauthorized") || error.message.includes("401") || error.message.includes("403")) {
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
    if (accounts.length > 0) {
      return accounts.flatMap(acc => acc.listings);
    }
    return listings;
  }, [accounts, listings]);

  // Derive Summary Statistics
  const summary = useMemo(() => {
    const total = activeListings.length;
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