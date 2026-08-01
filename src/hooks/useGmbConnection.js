"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureAppSessionCookie,
  getAppLoginToken,
  appAuthHeaders,
} from "@/lib/clientSession";

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

      // Header se identity bhejte hain — sirf cookie par bharosa karne se
      // impersonation ki doosri tab wali cookie is tab ka status dikha deti thi.
      const res = await fetch("/api/gmb/connection", {
        cache: "no-store",
        headers: appAuthHeaders(),
      });
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
    // Header ke bina disconnect kabhi-kabhi GALAT user ka connection hata deta
    // tha (cookie kisi doosri impersonation tab ki ho sakti hai) — aur is tab me
    // "kuch hua hi nahi" jaisa dikhta tha.
    const res = await fetch("/api/gmb/disconnect", {
      method: "POST",
      headers: appAuthHeaders(),
    });
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
  // Identity header ke saath — warna consent screen ke baad connection GALAT user
  // ke record par ban jata tha (browser-wide cookie kisi doosri impersonation tab
  // ki ho sakti hai). Us user ko baad me dobara "Connect GMB" dikhta tha.
  let res = await fetch(url, { method: "POST", headers: appAuthHeaders() });

  if (res.status === 401) {
    // Cookie race / stale cookie — token se dobara set karke ek retry.
    const token = getAppLoginToken();
    if (token) {
      await fetch("/api/auth/session-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      res = await fetch(url, { method: "POST", headers: appAuthHeaders() });
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      // Retry ke baad bhi 401 ka matlab hai login token sach me expire ho chuka
      // hai — "reload karke dobara try karo" kehna bekaar tha, reload se wo wapas
      // valid nahi hota. Seedha login par bhej do.
      throw new Error("Your login has expired. Please log in again.");
    }
    throw new Error("Couldn't start Google connect. Please try again.");
  }

  const { url: consentUrl } = await res.json();
  if (!consentUrl) {
    throw new Error("Couldn't start Google connect. Please try again.");
  }
  window.location.href = consentUrl;
}
