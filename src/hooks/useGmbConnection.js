"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureAppSessionCookie, getAppLoginToken } from "@/lib/clientSession";

export { getAppLoginToken };

/**
 * `useSession()` ka GMB-specific replacement.
 *
 * Farak: ye app login ke baare me kuch nahi kehta. GMB token expire hone par
 * `needsReconnect` true hota hai — user app me logged in rehta hai.
 *
 * Har server call se pehle `ensureAppSessionCookie()` await karte hain, warna
 * cookie set hone se pehle request ja sakti hai aur 401 mil jaata hai.
 */
export function useGmbConnection() {
  const [state, setState] = useState({
    loading: true,
    loggedIn: false,
    connected: false,
    needsReconnect: false,
    email: null,
    name: null,
    image: null,
  });

  const refresh = useCallback(async () => {
    try {
      await ensureAppSessionCookie();

      const res = await fetch("/api/gmb/connection", { cache: "no-store" });
      const data = await res.json();
      setState({
        loading: false,
        loggedIn: !!data.loggedIn,
        connected: !!data.connected,
        needsReconnect: !!data.needsReconnect,
        email: data.email || null,
        name: data.name || null,
        image: data.image || null,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Google consent par bhejta hai. `signIn("google")` ki jagah. */
  const connect = useCallback(async (callbackUrl = "/dashboard") => {
    await startGmbConnect(callbackUrl);
  }, []);

  /** `signOut()` ki jagah — sirf GMB hatata hai, app logout nahi karta. */
  const disconnect = useCallback(async () => {
    await ensureAppSessionCookie();
    const res = await fetch("/api/gmb/disconnect", { method: "POST" });
    await refresh();
    return res.ok;
  }, [refresh]);

  return { ...state, refresh, connect, disconnect };
}

/**
 * Hook ke bahar (event handlers) se GMB connect shuru karta hai.
 *
 * Pehle 401 milte hi seedha `/login` bhej deta tha — isi wajah se phone-login
 * ke baad "Connect GMB" dabane par user login page par pahunch jata tha, kyunki
 * session cookie abhi set hi nahi hui thi. Ab: cookie ensure karo, ek baar retry
 * karo, aur `/login` sirf tab jab app login token sach me maujood na ho.
 */
export async function startGmbConnect(callbackUrl = "/dashboard") {
  const url = `/api/gmb/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  await ensureAppSessionCookie();
  let res = await fetch(url, { method: "POST" });

  if (res.status === 401) {
    // Cookie race / stale cookie — token se dobara set karke ek retry.
    const token = getAppLoginToken();
    if (token) {
      await fetch("/api/auth/session-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      res = await fetch(url, { method: "POST" });
    }
  }

  if (!res.ok) {
    // Ab bhi 401 = app me sach me logged in nahi.
    if (!getAppLoginToken()) {
      window.location.href = "/login";
      return;
    }
    throw new Error("Couldn't start Google connect. Please try again.");
  }

  const { url: consentUrl } = await res.json();
  window.location.href = consentUrl;
}
