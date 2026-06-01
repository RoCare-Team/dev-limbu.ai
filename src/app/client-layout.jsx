"use client";

import { useSession, signOut } from "next-auth/react";
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
  }, [session, router]);

  return <>{children}</>;
}

export default function ClientLayout({ children }) {
  return (
    <AuthErrorChecker>
      {children}
    </AuthErrorChecker>
  );
}
