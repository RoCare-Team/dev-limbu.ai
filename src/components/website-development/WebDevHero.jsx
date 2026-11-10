import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import WebDevArt from "../home/art/WebDevArt";

const POINTS = ["Mobile-friendly", "SEO-ready", "Support included"];

export default function WebDevHero() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 md:px-10 lg:grid-cols-2 lg:pb-20 lg:pt-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#facc15]" /> Website Development
          </span>
          <h1
            className="mt-5 font-black leading-[1.05] tracking-tight text-slate-900"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem, 4.6vw, 3.6rem)" }}
          >
            Get a Website That Sells{" "}
            <span className="relative inline-block whitespace-nowrap text-[#eab308]">
              with Limbu AI
              <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-[#facc15]/70" />
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-slate-500">
            Fast, mobile-friendly websites for local businesses, from a simple 5-page site to a
            full online store. Clear pricing, no hidden costs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-6 py-3.5 text-sm font-black text-black shadow-[0_8px_24px_rgba(234,179,8,0.35)] transition-transform hover:-translate-y-0.5"
            >
              See Plans & Pricing <ArrowRight size={16} />
            </a>
            <a
              href="tel:+919289344726"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition-colors hover:border-slate-300"
            >
              <Phone size={15} /> Talk to an Expert
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <CheckCircle2 size={16} className="fill-slate-900 text-white" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden sm:block">
          <WebDevArt />
        </div>
      </div>
    </section>
  );
}
