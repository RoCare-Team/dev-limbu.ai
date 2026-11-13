import { Suspense } from "react";
import SocialHub from "@/components/social-media/SocialHub";

export const metadata = {
  title: "Social Media | Limbu AI",
  robots: { index: false, follow: false },
};

/** Social Media overview: connected accounts only; each tool has its own page in the sidebar. */
export default function SocialMediaPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* useSearchParams (inside the account hooks) needs a Suspense boundary */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-slate-100" />}>
        <SocialHub />
      </Suspense>
    </div>
  );
}
