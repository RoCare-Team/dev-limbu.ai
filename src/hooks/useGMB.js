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

export function useGMB(setUiState) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);

  const fetchInProgress = useRef(false);
  const connectedToastShownRef = useRef(false);

  const fetchInitialData = useCallback(
    async (forceRefresh = false, isBackground = false) => {
      const activeId = getActiveUserId();
      if (!activeId) return;

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
    [setUiState],
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

    if (activeId && !initialFetchDone) {
      fetchInitialData();
    }
  }, [initialFetchDone, fetchInitialData]);

  const activeListings = useMemo(() => {
    return accounts.flatMap((acc) => acc.listings || []);
  }, [accounts]);

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
    const activeId = getActiveUserId();
    if (activeId) {
      removeSessionStorage(getCacheKey(activeId));
      await fetchInitialData(true);
    }
  }, [fetchInitialData]);

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
    listings: activeListings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh,
    handleDisconnectGMB,
  };
}
