"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ImpersonateLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const encodedData = searchParams.get("data");

    if (!encodedData) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(encodedData));

      sessionStorage.setItem("userToken", parsed.token);
      sessionStorage.setItem("impersonatedUser", parsed.impersonatedUser);
      sessionStorage.setItem("userId", parsed.userId);

      sessionStorage.setItem("impersonatedEmail", parsed.impersonatedEmail);

      sessionStorage.setItem("isImpersonating", "true");

      sessionStorage.setItem("userName", parsed.impersonatedName);

      sessionStorage.setItem("fullName", parsed.impersonatedName);

      sessionStorage.setItem("userEmail", parsed.impersonatedEmail);

      sessionStorage.setItem("email", parsed.impersonatedEmail);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  }, [router, searchParams]);

  return <div>Logging in...</div>;
}
