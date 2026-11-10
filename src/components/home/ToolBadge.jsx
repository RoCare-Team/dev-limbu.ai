import { Coins, Hourglass, Lock } from "lucide-react";

// Pill badge, same badges as the app.
export default function ToolBadge({ badge, coinCost }) {
  if (!badge) return null;
  const base =
    "flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide";
  switch (badge) {
    case "FREE":
      return <span className={`${base} bg-[#facc15] text-black`}>Free</span>;
    case "UPGRADE":
      return (
        <span className={`${base} bg-slate-900 text-[#facc15]`}>
          <Lock size={9} strokeWidth={3} /> Upgrade
        </span>
      );
    case "UNLOCK":
      // Quiet lock; the GMB banner above the cards explains the plan.
      return (
        <span
          title="Unlock with the GMB Plan"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-slate-900 group-hover:text-[#facc15]"
        >
          <Lock size={11} strokeWidth={2.5} />
        </span>
      );
    case "COINS":
      return (
        <span className={`${base} bg-amber-50 text-amber-800 ring-1 ring-amber-200`}>
          <Coins size={10} strokeWidth={3} /> {coinCost || "Coins"}
        </span>
      );
    case "COMING SOON":
      return (
        <span className={`${base} bg-slate-100 text-slate-500 ring-1 ring-slate-200`}>
          <Hourglass size={9} strokeWidth={3} /> Soon
        </span>
      );
    case "NEW":
      return <span className={`${base} bg-slate-900 text-white`}>New</span>;
    default:
      // ACTIVE, HOT, PRO, ...
      return <span className={`${base} bg-slate-900 text-white`}>{badge}</span>;
  }
}
