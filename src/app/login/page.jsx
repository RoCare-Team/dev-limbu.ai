import { Suspense } from "react";
import Login from "@/components/login";

/**
 * `Login` andar `useSearchParams()` use karta hai, jo prerender ke waqt bail out
 * karta hai — Suspense boundary ke bina poora route client-render par chala jata.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Login />
    </Suspense>
  );
}
