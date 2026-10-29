"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Link to a page that needs an account. Logged-out visitors (no token in
 * localStorage, same check as useAuthStore) are sent to /login instead.
 * The real href stays on the anchor, so crawlers and "open in new tab" still see it.
 */
export default function AuthLink({ href, onClick, children, ...props }) {
  const router = useRouter();

  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    let loggedIn = false;
    try {
      loggedIn = Boolean(localStorage.getItem("token"));
    } catch {
      // Storage blocked — treat as logged out.
    }
    if (!loggedIn) {
      e.preventDefault();
      router.push("/login");
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
