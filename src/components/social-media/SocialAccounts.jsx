"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, Plus } from "lucide-react";

export const PLATFORMS = {
  facebook: { name: "Facebook", icon: "/social-icon/facebook-icon.png", what: "Pages", tint: "from-blue-50" },
  instagram: { name: "Instagram", icon: "/social-icon/instagram-icon.png", what: "Business accounts", tint: "from-pink-50" },
  linkedin: { name: "LinkedIn", icon: "/social-icon/linkedin.png", what: "Profile & company pages", tint: "from-sky-50" },
  youtube: { name: "YouTube", icon: "/social-icon/youtube-icon.svg", what: "Channels", tint: "from-red-50" },
  pinterest: { name: "Pinterest", icon: "/social-icon/pinterest-icon.png", what: "Profiles", tint: "from-rose-50" },
};

function AccountCard({ id, count, names = [], ready, locked }) {
  const p = PLATFORMS[id];
  const connected = count > 0;
  // Manage opens the platform page; connecting starts on the dashboard tab that owns each OAuth flow.
  const href = locked ? "/#tools-social_media" : connected ? `/social-media/${id}` : `/dashboard?tab=${id}`;
  const shown = names.slice(0, 2);
  const more = Math.max(0, count - shown.length);

  return (
    <div
      className={`group flex flex-col rounded-3xl border bg-gradient-to-b ${p.tint} to-white to-60% p-5 transition-all duration-300 ${
        connected ? "border-emerald-200" : "border-slate-200"
      } ${locked ? "opacity-80" : "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Image src={p.icon} alt="" width={30} height={30} />
        </span>
        {!ready ? (
          <span className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
        ) : connected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 size={12} /> Connected
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">Not connected</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">{p.name}</h3>
      <p className="text-xs font-semibold text-slate-500">{p.what}</p>

      {/* Which pages / profiles are connected */}
      <div className="mt-3 min-h-[44px]">
        {ready && connected ? (
          <ul className="space-y-1">
            {shown.map((n) => (
              <li key={n} className="truncate text-sm font-semibold text-slate-700">
                • {n}
              </li>
            ))}
            {more > 0 && <li className="text-xs font-bold text-slate-400">+{more} more</li>}
            {!shown.length && <li className="text-sm font-semibold text-slate-700">{count} connected</li>}
          </ul>
        ) : ready ? (
          <p className="text-sm text-slate-500">Connect once and publish to {p.name} from Limbu AI.</p>
        ) : null}
      </div>

      <Link
        href={href}
        className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors ${
          locked
            ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-[#facc15] hover:text-black"
            : connected
              ? "border border-slate-200 bg-white text-slate-800 hover:border-slate-900"
              : "bg-slate-900 text-white hover:bg-slate-700"
        }`}
      >
        {locked ? (
          <>
            <Lock size={14} /> Upgrade to connect
          </>
        ) : connected ? (
          <>
            Manage <ArrowRight size={14} />
          </>
        ) : (
          <>
            <Plus size={14} /> Connect {p.name}
          </>
        )}
      </Link>
    </div>
  );
}

/** Platform cards. `accounts` from useSocialAccounts; `locked` without a plan. */
export default function SocialAccounts({ accounts, ready, locked }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((a) => (
        <AccountCard key={a.id} {...a} ready={ready} locked={locked} />
      ))}
    </div>
  );
}
