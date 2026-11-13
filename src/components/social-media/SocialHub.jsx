"use client";

import Link from "next/link";
import { Clapperboard, Link2 } from "lucide-react";
import SocialAccounts from "./SocialAccounts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useUserHomeSections } from "@/hooks/useUserHomeSections";

/**
 * Social Media overview: header with how many platforms are connected, then a
 * card per platform (connect / manage). The tools live in the sidebar.
 */
function Overview() {
  const { planGroups } = useUserHomeSections();
  const { accounts, ready } = useSocialAccounts();
  // Connecting needs any paid plan; null while loading
  const locked = Array.isArray(planGroups) && planGroups.length === 0;
  const connected = accounts.filter((a) => a.count > 0).length;
  const pct = Math.round((connected / accounts.length) * 100);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(ellipse_at_100%_0%,rgba(250,204,21,0.18),transparent_45%),#fff] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              Social Media
            </h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-slate-500">
              Connect your accounts once. Then post, reply and track everything from the tools in the sidebar.
            </p>
          </div>
          <Link
            href="/video-generation"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
          >
            <Clapperboard size={16} className="text-[#facc15]" /> Make a Reel
          </Link>
        </div>

        {/* Connection progress */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] text-slate-950">
            <Link2 size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">
              {ready ? `${connected} of ${accounts.length} platforms connected` : "Checking your accounts…"}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#facc15] to-amber-500 transition-all duration-700" style={{ width: `${ready ? pct : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-black text-slate-900 sm:text-xl">Connected accounts</h2>
        <p className="mb-4 mt-0.5 text-sm text-slate-500">Connect a platform once and publish to it from Limbu AI.</p>
        <SocialAccounts accounts={accounts} ready={ready && planGroups !== null} locked={locked} />
      </section>
    </>
  );
}

export default function SocialHub() {
  return <Overview />;
}
