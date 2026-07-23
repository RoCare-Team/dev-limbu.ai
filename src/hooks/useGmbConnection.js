"use client";

import { useCallback, useEffect, useState } from "react";
import { getLocalStorage, getSessionStorage } from "@/utils/storage";

/**
 * `useSession()` ka GMB-specific replacement.
 *
 * Farak: ye app login ke baare me kuch nahi kehta. GMB token expire hone par
 * `needsReconnect` true hota hai — user app me logged in rehta hai.
 */
export function useGmbConnection() {
  const [state, setState] = useState({
    loading: true,
    connected: false,
    needsReconnect: false,
    email: null,
    name: null,
    image: null,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/gmb/connection", { cache: "no-store" });
      const data = await res.json();
      setState({
        loading: false,
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
    const res = await fetch(
      `/api/gmb/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      { method: "POST" },
    );
    if (!res.ok) {
      // App me hi logged in nahi hai — GMB connect ka koi matlab nahi.
      window.location.href = "/login";
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }, []);

  /** `signOut()` ki jagah — sirf GMB hatata hai, app logout nahi karta. */
  const disconnect = useCallback(async () => {
    const res = await fetch("/api/gmb/disconnect", { method: "POST" });
    await refresh();
    return res.ok;
  }, [refresh]);

  return { ...state, refresh, connect, disconnect };
}

/** Hook ke bahar (event handlers) se connect karne ke liye. */
export async function startGmbConnect(callbackUrl = "/dashboard") {
  const res = await fetch(
    `/api/gmb/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    { method: "POST" },
  );
  if (!res.ok) {
    window.location.href = "/login";
    return;
  }
  const { url } = await res.json();
  window.location.href = url;
}

/** Impersonation ko dhyan me rakhte hue app login token. */
export function getAppLoginToken() {
  const impersonating =
    getLocalStorage("isImpersonating") === "true" ||
    getSessionStorage("isImpersonating") === "true";
  if (impersonating) {
    return getSessionStorage("userToken") || getLocalStorage("userToken") || null;
  }
  return getLocalStorage("token") || null;
}
