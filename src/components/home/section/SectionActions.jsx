import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AuthLink from "../../AuthLink";
import HeroButtons from "../../sections/HeroButtons";

const TRUST_POINTS = ["Demo before you pay", "2-minute setup", "Made for local businesses"];

/** Top section: signup + demo buttons and trust points. */
export function HeroActions() {
  return (
    <>
      <div className="[&>div]:justify-start [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap">
        <HeroButtons />
      </div>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {TRUST_POINTS.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <CheckCircle2 size={16} className="fill-slate-900 text-white" /> {p}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Other sections: "View All Tools", plus any extra button (e.g. a video) beside it. */
export function ViewAllAction({ link, children }) {
  if (!link && !children) return null;
  const LinkTag = link?.login ? AuthLink : Link;
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      {link && (
        <LinkTag
          href={link.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
        >
          View All Tools <ArrowRight size={15} />
        </LinkTag>
      )}
      {children}
    </div>
  );
}
