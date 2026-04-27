"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function AuthErrorChecker({ children }) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("Session error detected: Token expired or revoked. Forcing sign out.");
      signOut({ callbackUrl: "/login" });
    }

    // Sync userId to localStorage for Google users
    if (session?.user?.userId) {
      const currentStoredId = localStorage.getItem("userId");
      if (currentStoredId !== session.user.userId) {
        console.log("Syncing userId to localStorage:", session.user.userId);
        localStorage.setItem("userId", session.user.userId);
        
        // Also sync other details if available and missing
        if (session.user.name && !localStorage.getItem("fullName")) {
          localStorage.setItem("fullName", session.user.name);
        }
        if (session.user.email && !localStorage.getItem("email")) {
          localStorage.setItem("email", session.user.email);
        }
      }
    }
  }, [session, router]);

  return <>{children}</>;
}

export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <AuthErrorChecker>
        {children}
      </AuthErrorChecker>
    </SessionProvider>
  );
}
