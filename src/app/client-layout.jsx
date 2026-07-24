"use client";

import SessionCookieSync from "@/components/SessionCookieSync";

/**
 * Pehle yahan NextAuth ka `RefreshAccessTokenError` dekhkar `signOut()` hota tha —
 * yaani Google ka GMB token expire hote hi user poore app se logout ho jata tha.
 *
 * Ab GMB ek connected account hai, login method nahi. Token fail hone par
 * `/api/gmb/connection` `needsReconnect: true` deta hai aur UI sirf
 * "Reconnect GMB" dikhati hai. App login ko haath nahi lagta.
 */
export default function ClientLayout({ children }) {
  return (
    <>
      <SessionCookieSync />
      {children}
    </>
  );
}
