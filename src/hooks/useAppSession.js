"use client";

import { useEffect, useState } from "react";
import { getLocalStorage, getSessionStorage } from "@/utils/storage";
import { ensureAppSessionCookie } from "@/lib/clientSession";

/**
 * NextAuth ke `useSession()` ka drop-in replacement.
 *
 * Wahi shape lautata hai — `{ data: session, status }` — taaki purane call
 * sites ka code jaisa hai waisa chale. Farak sirf source ka hai:
 *   • identity  → app ka apna login (localStorage)
 *   • token     → GmbConnection (server par refresh hota hai)
 *
 * `status` ab GMB connection batata hai, app login nahi — kyunki purane call
 * sites `status === "authenticated"` ko "GMB use kar sakte hain" ke matlab me
 * hi istemal karte the.
 */
export function useAppSession() {
  const [state, setState] = useState({ data: null, status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const email =
        getSessionStorage("email") ||
        getSessionStorage("userEmail") ||
        getLocalStorage("email") ||
        getLocalStorage("userEmail") ||
        null;
      const name =
        getSessionStorage("userName") ||
        getLocalStorage("userName") ||
        getSessionStorage("fullName") ||
        getLocalStorage("fullName") ||
        null;

      try {
        // Cookie set hone se pehle call gayi to 401 aata hai — pehle ensure karo.
        await ensureAppSessionCookie();
        const res = await fetch("/api/gmb/access-token", { cache: "no-store" });

        if (!res.ok) {
          if (cancelled) return;
          // GMB connected nahi — par user app me logged in ho sakta hai.
          setState({
            data: email ? { user: { email, name }, accessToken: null } : null,
            status: "unauthenticated",
          });
          return;
        }

        const data = await res.json();
        if (cancelled) return;
        setState({
          data: {
            user: { email: data.email || email, name },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          status: "authenticated",
        });
      } catch {
        if (!cancelled) setState({ data: null, status: "unauthenticated" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Purane `import { useSession } from "next-auth/react"` ka alias. */
export const useSession = useAppSession;
