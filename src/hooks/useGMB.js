import { getLocalStorage, getSessionStorage, removeSessionStorage, setSessionStorage } from "@/utils/storage";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useGmbConnection } from "@/hooks/useGmbConnection";
import { ensureAppSessionCookie, getAppLoginToken, appAuthHeaders } from "@/lib/clientSession";

const CACHE_EXPIRY_MS = 10 * 60 * 1000;
// Sirf email se cache key banane par do alag app users ek hi Google/GMB
// account se connected ho to (jo ye codebase explicitly support karta hai)
// ek dusre ka cached data dikha dete the. App `userId` bhi key me shaamil
// karke har account ka cache alag rehta hai.
const getCacheKey = (email, userId) => `gmb_data_${userId || "anon"}_${email || "unknown"}`;

async function storeUserListingsForAdmin(userId, userEmail, listings) {
  try {
    await fetch('/api/admin/saveBussiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `userId` asli key hai — do alag userId same email share kar sakte
      // hain, tab sirf email se ek user ka data doosre par overwrite/leak
      // ho jata tha. `userEmail` sirf display ke liye saath bhejte hain.
      body: JSON.stringify({ userId, userEmail, listings }),
    });
  } catch (error) { console.error('Error storing listings:', error); }
}

/** App ka apna userId — cache key isolation ke liye (useFacebook.js jaisa hi pattern). */
function getActiveUserId() {
  const isImpersonating =
    getLocalStorage("isImpersonating") === "true" ||
    getSessionStorage("isImpersonating") === "true";
  return isImpersonating
    ? getSessionStorage("impersonatedUser") || getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

/** App ka apna email — NextAuth session ki jagah. */
function getAppEmail() {
  const isImpersonating =
    getLocalStorage("isImpersonating") === "true" ||
    getSessionStorage("isImpersonating") === "true";

  if (isImpersonating) {
    return (
      getSessionStorage("impersonatedEmail") ||
      getLocalStorage("impersonatedEmail") ||
      getSessionStorage("email") ||
      null
    );
  }
  return getLocalStorage("email") || getLocalStorage("userEmail") || null;
}

// --- Main Hook ---
// `session`/`status` ab NextAuth se nahi aate — GMB connection status se aate hain.
export function useGMB(_legacySession, _legacyStatus, setUiState) {
  const gmb = useGmbConnection();
  // `gmb` har render par naya object hai. useCallback/useEffect deps me use
  // karne se infinite re-render loop ban jata, isliye primitives + stable
  // callbacks hi deps me jaate hain.
  const { connected: gmbConnected, refresh: refreshGmb, disconnect: disconnectGmb } = gmb;

  const [accounts, setAccounts] = useState([]);      // Live Google Data
  const [listings, setListings] = useState([]);      // Database Listings (Impersonation)
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);

  const fetchInProgress = useRef(false);

  // Google account ka email (connection se) — cache key isi par bani rehti hai.
  const gmbEmail = gmb.email || getAppEmail();

  // 1. Fetch from Database (Handles both Impersonation and Normal Fallback)
  const fetchAdminListings = useCallback(async () => {
    const isImpersonating = getLocalStorage("isImpersonating") === "true";

    // Same Logic as old dashboard.js
    const token = isImpersonating ? getLocalStorage("userToken") : getLocalStorage("adminToken");
    // `userId` se query karte hain, email se nahi — email do alag app
    // accounts ke beech shared/reused ho sakta hai, tab email-based lookup
    // ek user ka saved GMB data doosre user ke dashboard par dikha deta.
    const userId = getActiveUserId();

    if (!token || !userId) return;

    try {
      const res = await fetch(
        `/api/admin/saveBussiness?userId=${encodeURIComponent(userId)}`,
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
  }, []);

  // 2. Live Backend Fetch (Secure, bypasses browser CORS & Ad-blockers)
  const fetchInitialData = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!gmbConnected) return;

    const userEmail = gmbEmail;
    const cacheKey = getCacheKey(userEmail, getActiveUserId());

    // Cache check.
    // Khaali result kabhi cache se serve nahi karte — warna ek purani failed/
    // empty fetch 10 minute tak "No Profiles Found" dikhati rehti hai, chahe
    // user beech me GMB connect hi kyun na kar le.
    if (!forceRefresh) {
      const cached = JSON.parse(getSessionStorage(cacheKey) || null);
      if (
        cached?.timestamp &&
        Date.now() - cached.timestamp < CACHE_EXPIRY_MS &&
        cached.accounts?.[0]?.listings?.length > 0
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
      // SECURE CALL: We now ask our own backend to fetch Google data.
      // Backend GmbConnection se fresh token nikaalta hai (refresh sameth).
      await ensureAppSessionCookie();
      // Header se identity bhejte hain — sirf browser-wide cookie par
      // bharosa karne se doosri tab/user ki cookie is tab ka status dikha
      // deti thi (waisa hi jaisa useGmbConnection.js karta hai).
      let res = await fetch("/api/gmb/dashboard-live", {
        cache: "no-store",
        headers: appAuthHeaders(),
      });

      // 401 = app session cookie missing/expire. Ye GMB ka issue NAHI hai —
      // cookie dobara set karke ek retry karo. Pehle ise bhi "session expired"
      // maan liya jata tha, isliye modal turant aa jata tha.
      if (res.status === 401) {
        const token = getAppLoginToken();
        if (token) {
          await fetch("/api/auth/session-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          res = await fetch("/api/gmb/dashboard-live", {
            cache: "no-store",
            headers: appAuthHeaders(),
          });
        }
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error || `API Error: ${res.status}`);
        err.code = body.code;
        err.status = res.status;
        throw err;
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
      const activeUserId = getActiveUserId();
      if (allListings.length > 0 && (activeUserId || userEmail)) {
        await storeUserListingsForAdmin(activeUserId, userEmail, allListings);
      }

    } catch (error) {
      console.error("❌ Live Fetch Error:", error);

      // Reconnect modal SIRF tab jab server ne pakka kaha ho ki refresh token
      // mar chuka hai. Baaki sab (503 transient, 502 Google error, 401 app
      // session) ke liye sirf toast — warna har chhoti dikkat par "Session
      // Expired" aa jata tha.
      if (error.code === "GMB_RECONNECT_REQUIRED") {
        setUiState(prev => ({ ...prev, needsGmbReconnect: true }));
        refreshGmb();
      } else if (error.status === 401) {
        // App login ka masla — GMB modal dikhana galat hoga.
        if (!isBackground) {
          toast.error("Couldn't refresh your login session. Please reload the page.");
        }
      } else if (!isBackground) {
        toast.error(`Couldn't load GMB listings: ${error.message}`);
      }
    } finally {
      setInitialFetchDone(true);
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [gmbConnected, gmbEmail, refreshGmb, setUiState]);

  // Callback abhi-abhi `?gmb_connected=1` ke saath wapas bheja hai — us case me
  // cache bypass karke seedha Google se fresh list laani hai, warna pichhli
  // (khaali) cache ya stale state dikh jati hai.
  const justConnected =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("gmb_connected") === "1";

  // Orchestration: DB hamesha, Google live tab jab GMB connected ho
  useEffect(() => {
    fetchAdminListings();

    if (gmbConnected && !initialFetchDone) {
      fetchInitialData(justConnected);
    }
  }, [gmbConnected, initialFetchDone, justConnected, fetchAdminListings, fetchInitialData]);

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

    removeSessionStorage(getCacheKey(gmbEmail, getActiveUserId()));
    if (gmbConnected) await fetchInitialData(true);
  }, [gmbConnected, gmbEmail, fetchAdminListings, fetchInitialData]);

  // GMB disconnect — app login ko haath nahi lagta.
  const handleDisconnectGMB = useCallback(async () => {
    const ok = await disconnectGmb();
    if (ok) {
      removeSessionStorage(getCacheKey(gmbEmail, getActiveUserId()));
      setAccounts([]);
      setListings([]);
      setInitialFetchDone(false);
      toast.success("Google Business Profile disconnected");
    }
    return ok;
  }, [disconnectGmb, gmbEmail]);

  return {
    accounts,
    loading: loading || gmb.loading,
    // Sirf connection-status check — listings fetch isme shaamil nahi.
    gmbLoading: gmb.loading,
    initialFetchDone,
    noAccountsFound,
    listings,
    activeListings,
    summary,
    fetchInitialData,
    handleManualRefresh,
    handleDisconnectGMB,
    // Connection state — UI "Connect" / "Reconnect" isse decide karta hai.
    gmbConnected: gmb.connected,
    needsGmbReconnect: gmb.needsReconnect,
    connectGMB: gmb.connect,
  };
}
