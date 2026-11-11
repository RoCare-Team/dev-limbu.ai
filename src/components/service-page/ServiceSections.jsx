/**
 * Building blocks for the service detail pages (/seo-tools/<slug>, /ads/<slug>).
 * All server components: each page passes its own data and buttons.
 */
import Link from "next/link";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { TileIcon } from "@/components/home/toolIcons";

export const SITE_URL = "https://www.limbu.ai";
export const PHONE = "+919289344726";
export const PHONE_LABEL = "+91 9289344726";

export const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#eab308] px-6 py-3.5 text-sm font-bold text-slate-900 shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] transition-colors hover:bg-[#ca8a04]";
export const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50";
export const ON_DARK_BTN =
  "inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10";

/** JSON-LD <script> tags. */
export function Schemas({ schemas }) {
  return schemas.map((schema, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  ));
}

/** Home > Section > Page, as BreadcrumbList schema. */
export const breadcrumbSchema = (section, name, url) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: section.label, item: `${SITE_URL}${section.href}` },
    { "@type": "ListItem", position: 3, name, item: url },
  ],
});

export const faqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

/** Page metadata shared by the detail pages. */
export function serviceMetadata({ title, description, url }) {
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Limbu.ai", type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Breadcrumb, icon + badge, H1, tagline, intro, buttons and a small note.
 * `section` = { label, href } of the home section the page belongs to.
 */
export function ServiceHero({ section, name, icon, badge, title, tagline, intro, actions, note }) {
  return (
    <section className="bg-gradient-to-br from-amber-50/70 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-28 md:px-10 lg:pb-20 lg:pt-32">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm font-medium text-slate-500">
          <Link href="/" className="hover:text-slate-800">Home</Link>
          <span className="mx-2">/</span>
          <Link href={section.href} className="hover:text-slate-800">{section.label}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm ring-1 ring-slate-200">
            <TileIcon icon={icon} size={22} className="text-current" />
          </span>
          {badge}
        </div>

        <h1
          className="mt-5 max-w-3xl font-black leading-[1.08] tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
        >
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg font-semibold text-slate-700">{tagline}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-500">{intro}</p>

        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
        {note && <p className="mt-5 text-sm font-semibold text-slate-600">{note}</p>}
      </div>
    </section>
  );
}

export function FeatureGrid({ features, title = "What's included" }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
      <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">{title}</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CheckCircle2 size={18} className="flex-shrink-0 fill-emerald-500 text-white" />
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Numbered steps on the left, deliverables + "best for" on the right. */
export function HowItWorks({ steps, deliverables, whoFor }) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">How it works</h2>
          <ol className="mt-8 space-y-4">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-[#facc15]">
                  {i + 1}
                </span>
                <span className="text-base font-semibold text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-900">What you get</h2>
          <ul className="mt-5 space-y-3">
            {deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 fill-[#facc15] text-white" /> {d}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-base font-black text-slate-900">Best for</h3>
          <ul className="mt-3 space-y-2">
            {whoFor.map((w) => (
              <li key={w} className="text-sm text-slate-500">• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Section with a centered heading, e.g. the plans block. */
export function CenteredSection({ id, title, text, children }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 md:px-10 lg:py-20">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">{title}</h2>
        {text && <p className="mx-auto mt-3 max-w-2xl text-slate-500">{text}</p>}
      </div>
      {children}
    </section>
  );
}

export function FaqList({ faqs }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14 md:px-10 lg:py-20">
      <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">Frequently asked questions</h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
              {f.q}
              <ChevronDown size={18} className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ title, text, actions }) {
  return (
    <section className="px-6 md:px-10">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-900 px-6 py-12 text-center sm:px-12">
        <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
        {text && <p className="mx-auto mt-3 max-w-xl text-slate-300">{text}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </section>
  );
}

/** "More <section> tools" grid. items: [{ href, name, icon, free? }] */
export function RelatedLinks({ title, items }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
              <TileIcon icon={t.icon} size={18} className="text-current" />
            </span>
            <span className="text-sm font-bold text-slate-900">{t.name}</span>
            {t.free && (
              <span className="ml-auto rounded-full bg-[#facc15] px-2 py-0.5 text-[10px] font-black uppercase text-black">Free</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
