import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { whatsappHref } from "@/lib/seoTools";
import AuthLink from "../../AuthLink";
import HeroButtons from "../../sections/HeroButtons";

const TRUST_POINTS = ["Demo before you pay", "2-minute setup", "Made for local businesses"];

/** Top section: signup + demo buttons and trust points. */
export function HeroActions() {
  return (
    <>
      {/* Phones: full-width stacked buttons; larger screens: side by side */}
      <div className="[&>div]:mt-6 [&>div]:grid [&>div]:grid-cols-1 [&>div]:gap-3 sm:[&>div]:mt-8 sm:[&>div]:flex sm:[&>div]:justify-start [&_a]:w-full [&_a]:whitespace-nowrap [&_button]:w-full [&_button]:whitespace-nowrap sm:[&_a]:w-auto sm:[&_button]:w-auto">
        <HeroButtons />
      </div>
      {/* Trust points: hidden on phones to keep the top short; one line on larger screens */}
      <ul className="mt-5 hidden sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
        {TRUST_POINTS.map((p) => (
          <li
            key={p}
            className="flex flex-col items-center gap-1 rounded-xl bg-white/70 px-1 py-2 text-center text-[11px] font-semibold leading-tight text-slate-600 ring-1 ring-slate-200 sm:flex-row sm:gap-1.5 sm:bg-transparent sm:p-0 sm:text-left sm:text-sm sm:ring-0"
          >
            <CheckCircle2 size={16} className="shrink-0 fill-slate-900 text-white" /> {p}
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

/** WhatsApp "Get a Free Quote" button for service sections (sectionCopy `cta`). */
export function QuoteButton({ cta }) {
  return (
    <a
      href={whatsappHref(cta.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
    >
      <FaWhatsapp size={16} className="text-[#25D366]" /> {cta.label}
    </a>
  );
}
