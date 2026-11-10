import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AuthLink from "../AuthLink";
import ToolBadge from "./ToolBadge";
import { FEATURE_ICONS, FeatureIcon, TileIcon } from "./toolIcons";
import { actionHref, needsLogin } from "@/lib/homeSections/links";

/**
 * One tool card. Coming-soon tools are not clickable.
 * `onLockedClick` (client callers only): a locked card calls it instead of linking to /pricing.
 */
export function ToolCard({ item, onLockedClick, variant }) {
  const comingSoon = item.comingSoon || item.access?.status === "coming_soon";
  const isGbp = variant === "gbp";
  // Not in the user's plan -> the card sells the plan instead of opening the tool.
  const locked = item.access?.status === "locked";
  const href = comingSoon ? null : locked ? "/pricing" : actionHref(item.action);
  const tint = comingSoon
    ? "bg-slate-100 text-slate-400"
    : "bg-slate-50 text-slate-800 ring-1 ring-slate-200 group-hover:bg-[#facc15] group-hover:text-black group-hover:ring-[#facc15]";

  const body = (
    <>
      {/* Hover: light sweep across the card */}
      {href && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100" />
      )}
      {FEATURE_ICONS[item.key] && !comingSoon ? (
        <FeatureIcon Icon={FEATURE_ICONS[item.key]} />
      ) : (
        <span
          className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-lg ${tint}`}
        >
          <TileIcon icon={item.icon} size={20} className="text-current" />
        </span>
      )}
      <span className="relative flex min-w-0 flex-1 flex-col">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-[14.5px] font-bold leading-snug text-slate-900 ${comingSoon ? "opacity-60" : ""}`}>
            {item.label}
          </span>
          <ToolBadge badge={item.badge} coinCost={item.coinCost} />
        </span>
        {item.description && (
          <span className={`mt-1 text-[12.5px] font-medium leading-snug text-slate-500 ${comingSoon ? "opacity-60" : ""}`}>
            {item.description}
          </span>
        )}
        {item.coinCost > 0 && !comingSoon && (
          <span className="mt-1.5 text-xs font-bold text-amber-700">From {item.coinCost} coins</span>
        )}
      </span>
      {href && (
        <>
          {/* Hover: accent bar grows along the bottom, arrow slides in */}
          <span className="pointer-events-none absolute bottom-0 left-4 right-4 h-[3px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#facc15] to-amber-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <ArrowUpRight
            size={16}
            className="pointer-events-none absolute bottom-3 right-3 translate-y-1 text-slate-400 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-amber-600 group-hover:opacity-100"
          />
        </>
      )}
    </>
  );

  const className = `group relative flex h-full items-start gap-3.5 overflow-hidden border bg-white transition-all duration-300 ease-out ${
    isGbp
      ? "min-h-[112px] rounded-[18px] p-4 sm:p-[18px]"
      : "rounded-2xl p-4"
  }`;

  if (!href) {
    return (
      <div
        className={`${className} cursor-default border-slate-200/70 bg-white/70`}
        title={comingSoon ? "Coming soon" : undefined}
      >
        {body}
      </div>
    );
  }

  const activeClassName = `${className} border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.05)] hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-[0_20px_40px_-12px_rgba(234,179,8,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none`;

  if (locked && onLockedClick) {
    return (
      <button type="button" onClick={() => onLockedClick(item)} className={`${activeClassName} w-full text-left`}>
        {body}
      </button>
    );
  }

  const external = /^https?:\/\//.test(href);
  const LinkTag = !locked && needsLogin(item.action) ? AuthLink : Link;
  return (
    <LinkTag
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={activeClassName}
    >
      {body}
    </LinkTag>
  );
}
