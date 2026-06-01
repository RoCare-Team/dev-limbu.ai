import {
  getLocalStorage,
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/utils/storage";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

const CACHE_EXPIRY_MS = 10 * 60 * 1000;
const getCacheKey = (userId) => `gmb_data_${userId}`;

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

async function storeUserListingsForAdmin(userEmail, listings) {
  try {
    await fetch("/api/admin/saveBussiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, listings }),
    });
  } catch (error) {
    console.error("Error storing listings:", error);
  }
}

export function useGMB(session, status, setUiState) {
  const [accounts, setAccounts] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);

  const fetchInProgress = useRef(false);
  const connectedToastShownRef = useRef(false);

  const fetchAdminListings = useCallback(async () => {
    const isImpersonating = getLocalStorage("isImpersonating") === "true";
    const token = isImpersonating
      ? getLocalStorage("userToken")
      : getLocalStorage("adminToken");
    const email = isImpersonating
      ? getLocalStorage("impersonatedEmail")
      : session?.user?.email || getLocalStorage("userEmail") || getLocalStorage("email");

    if (!token || !email) return;

    try {
      const res = await fetch(
        `/api/admin/saveBussiness?userEmail=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } },
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

  const fetchInitialData = useCallback(
    async (forceRefresh = false, isBackground = false) => {
      const activeId = getActiveUserId();
      if (!activeId) return;

      const userEmail =
        session?.user?.email || getLocalStorage("userEmail") || getLocalStorage("email");
      const cacheKey = getCacheKey(activeId);

      if (!forceRefresh) {
        const cached = JSON.parse(getSessionStorage(cacheKey) || null);
        if (
          cached?.timestamp &&
          Date.now() - cached.timestamp < CACHE_EXPIRY_MS
        ) {
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
        const res = await fetch(
          `/api/gmb/pages?userId=${encodeURIComponent(activeId)}&refresh=${
            forceRefresh ? "true" : "false"
          }`,
        );

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        const finalData = data.accounts || [];
        const allListings = finalData.flatMap((account) => account.listings || []);

        setAccounts(finalData);
        setNoAccountsFound(data.noAccountsFound);

        setSessionStorage(
          cacheKey,
          JSON.stringify({
            accounts: finalData,
            noAccountsFound: data.noAccountsFound,
            timestamp: Date.now(),
          }),
        );

        if (userEmail && allListings.length > 0) {
          await storeUserListingsForAdmin(userEmail, allListings);
        }
      } catch (error) {
        console.error("GMB Fetch Error:", error);
        if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          setUiState((prev) => ({ ...prev, isSessionExpired: true }));
        }
      } finally {
        setInitialFetchDone(true);
        setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [session?.user?.email, setUiState],
  );

  useEffect(() => {
    const activeId = getActiveUserId();
    const search =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;

    if (activeId && search?.get("gmb") === "connected") {
      removeSessionStorage(getCacheKey(activeId));

      if (!connectedToastShownRef.current) {
        connectedToastShownRef.current = true;
        toast.success("Google Business Profile connected successfully!");
      }

      fetchInitialData(true).finally(() => {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/dashboard");
        }
      });
      return;
    }

    fetchAdminListings();

    if (activeId && !initialFetchDone) {
      fetchInitialData();
    }
  }, [session?.user?.email, initialFetchDone, fetchAdminListings, fetchInitialData]);

  const activeListings = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.flatMap((acc) => acc.listings);
    }
    return listings;
  }, [accounts, listings]);

  const summary = useMemo(() => {
    const total = activeListings.length;
    const verifiedCount = activeListings.filter(
      (l) => l.hasVoiceOfMerchant === true || l.verified === true,
    ).length;

    return {
      total,
      verified: verifiedCount,
      unverified: total - verifiedCount,
      pending: 0,
    };
  }, [activeListings]);

  const handleManualRefresh = useCallback(async () => {
    const isImpersonating = getLocalStorage("isImpersonating") === "true";

    if (isImpersonating) {
      toast.success("Refreshing from database...");
      await fetchAdminListings();
    }

    const activeId = getActiveUserId();
    if (activeId) {
      removeSessionStorage(getCacheKey(activeId));
      await fetchInitialData(true);
    }
  }, [fetchAdminListings, fetchInitialData]);

  const handleDisconnectGMB = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return false;

    try {
      const res = await fetch(
        `/api/gmb/disconnect?userId=${encodeURIComponent(activeId)}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to disconnect GMB");

      setAccounts([]);
      setListings([]);
      removeSessionStorage(getCacheKey(activeId));
      toast.success("Google Business Profile disconnected");
      return true;
    } catch (error) {
      console.error("Error disconnecting GMB:", error);
      toast.error("Failed to disconnect Google Business Profile");
      return false;
    }
  }, []);

  return {
    accounts,
    loading,
    initialFetchDone,
    noAccountsFound,
    listings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh,
    handleDisconnectGMB,
  };
}
