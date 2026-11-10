"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Plus } from "lucide-react";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

const PLATFORMS = {
  facebook: { name: "Facebook", icon: "/social-icon/facebook-icon.png" },
  instagram: { name: "Instagram", icon: "/social-icon/instagram-icon.png" },
  linkedin: { name: "LinkedIn", icon: "/social-icon/linkedin.png" },
  youtube: { name: "YouTube", icon: "/social-icon/youtube-icon.svg" },
  pinterest: { name: "Pinterest", icon: "/social-icon/pinterest-icon.png" },
};

function AccountCard({ id, count, ready, locked }) {
  const p = PLATFORMS[id];
  const connected = count > 0;
  // Connecting happens on the dashboard tab that already owns each OAuth flow.
  const href = `/dashboard?tab=${id}`;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 p-4 transition-all duration-300 ${
        locked
          ? "bg-slate-50"
          : "bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_14px_30px_-12px_rgba(234,179,8,0.3)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 ${locked ? "opacity-40 grayscale" : ""}`}>
          <Image src={p.icon} alt="" width={22} height={22} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">{p.name}</div>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-500">
            {!ready ? (
              "Checking…"
            ) : locked ? (
              <>
                <Lock size={11} /> Needs a plan
              </>
            ) : connected ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {count} connected
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Not connected
              </>
            )}
          </div>
        </div>
      </div>

      {locked ? (
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-[#facc15] hover:text-black"
        >
          <Lock size={13} /> Upgrade to connect
        </Link>
      ) : (
      <Link
        href={href}
        className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
          connected
            ? "border border-slate-200 text-slate-800 hover:border-slate-900"
            : "bg-slate-900 text-white hover:bg-slate-700"
        }`}
      >
        {connected ? (
          <>
            Manage <ArrowRight size={13} />
          </>
        ) : (
          <>
            <Plus size={13} /> Connect
          </>
        )}
      </Link>
      )}
    </div>
  );
}

/** `isPaid`: true / false, or null while the plan is loading. Connecting needs any paid plan. */
export default function SocialAccounts({ isPaid }) {
  const { accounts, ready } = useSocialAccounts();
  const locked = isPaid === false;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {accounts.map((a) => (
        <AccountCard key={a.id} {...a} ready={ready && isPaid !== null} locked={locked} />
      ))}
    </div>
  );
}
