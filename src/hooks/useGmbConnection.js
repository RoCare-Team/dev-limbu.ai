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
  const connect = useCallback(async (callbackUrl = "/dashboard", options) => {
    await startGmbConnect(callbackUrl, options);
  }, []);

  /** Naya Google account chunne ke liye — consent screen force karta hai. */
  const reconnect = useCallback(async (callbackUrl = "/dashboard", options) => {
    await startGmbConnect(callbackUrl, { ...options, forceConsent: true });
  }, []);

  /** `signOut()` ki jagah — sirf GMB hatata hai, app logout nahi karta. */
  const disconnect = useCallback(async () => {
    await ensureAppSessionCookie();
    const res = await fetch("/api/gmb/disconnect", { method: "POST" });
    await refresh();
    return res.ok;
  }, [refresh]);

  return { ...state, refresh, connect, reconnect, disconnect };
}

/**
 * Hook ke bahar (event handlers) se GMB connect shuru karta hai.
 *
 * `/login` par navigate karna yahan se hata diya gaya hai. AuthGuard localStorage
 * ke `userId` par chalta hai, jabki hum `token` dekhte the — dono me se ek bhi
 * mismatch ho to /login turant /dashboard par bounce kar deta tha, jo pehle click
 * par "page apne aap refresh ho gaya" jaisa dikhta tha. Ab failure par sirf error
 * throw hota hai aur caller toast dikhata hai.
 */
export async function startGmbConnect(callbackUrl = "/dashboard", options = {}) {
  // `phone` sirf WhatsApp chatbot flow (/connect-google-business) bhejta hai,
  // jahan user app me logged in nahi hota.
  const params = new URLSearchParams({ callbackUrl });
  if (options.phone) params.set("phone", options.phone);
  // `forceConsent` tab jab user jaan-boojhkar Google account switch kar raha ho —
  // warna consent screen apne aap skip ho jata hai agar connection pehle se hai.
  if (options.forceConsent) params.set("consent", "1");
  const url = `/api/gmb/connect?${params.toString()}`;

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
    throw new Error(
      res.status === 401
        ? "Your login session isn't active. Please reload the page and try again."
        : "Couldn't start Google connect. Please try again.",
    );
  }

  const { url: consentUrl } = await res.json();
  if (!consentUrl) {
    throw new Error("Couldn't start Google connect. Please try again.");
  }
  window.location.href = consentUrl;
}
