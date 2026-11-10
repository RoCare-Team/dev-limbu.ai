import Link from "next/link";
import { Clapperboard, PenSquare } from "lucide-react";
import SocialHub from "@/components/social-media/SocialHub";
import { getHomeSectionsForWeb } from "@/lib/homeSections/web";

export const metadata = {
  title: "Social Media | Limbu AI",
  robots: { index: false, follow: false },
};

export default async function SocialMediaPage() {
  const sections = await getHomeSectionsForWeb();

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Social Media
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Connect your accounts, create posts and reels, and grow your audience.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/post-management"
            className="inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-4 py-2.5 text-sm font-black text-black transition-colors hover:bg-[#fde047]"
          >
            <PenSquare size={16} /> Create Post
          </Link>
          <Link
            href="/video-generation"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:border-slate-900"
          >
            <Clapperboard size={16} /> Make a Reel
          </Link>
        </div>
      </div>

      {/* Guest view renders first; the client swaps in this user's plan + badges */}
      <SocialHub initialSections={sections} />
    </div>
  );
}
