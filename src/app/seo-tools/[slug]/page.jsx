import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronDown, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import AuthLink from "@/components/AuthLink";
import { TileIcon } from "@/components/home/toolIcons";
import SeoPlansCheckout from "@/components/seo/SeoPlansCheckout";
import { SEO_PLANS, formatInr } from "@/lib/seoPlans";
import { SEO_TOOL_LIST, seoToolBySlug, seoToolPath, whatsappHref } from "@/lib/seoTools";

const minPlanPrice = Math.min(...SEO_PLANS.map((p) => p.basePrice));

const SITE_URL = "https://www.limbu.ai";
const PHONE = "+919289344726";
const PHONE_LABEL = "+91 9289344726";

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_TOOL_LIST.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = seoToolBySlug(slug);
  if (!tool) return {};
  const url = `${SITE_URL}${seoToolPath(tool)}`;
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url,
      siteName: "Limbu.ai",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: tool.metaTitle, description: tool.metaDescription },
  };
}

function schemasFor(tool) {
  const url = `${SITE_URL}${seoToolPath(tool)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: tool.name,
      description: tool.metaDescription,
      url,
      serviceType: tool.name,
      areaServed: "India",
      provider: { "@type": "Organization", name: "Limbu.ai", url: SITE_URL },
      offers: tool.free
        ? { "@type": "Offer", price: "0", priceCurrency: "INR" }
        : {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: String(Math.min(...SEO_PLANS.map((p) => p.basePrice))),
            highPrice: String(Math.max(...SEO_PLANS.map((p) => p.basePrice))),
            offerCount: String(SEO_PLANS.length),
          },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Website SEO", item: `${SITE_URL}/#tools-website_seo` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
  ];
}

/**
 * Primary button: paid services go to the plans on this page; the free audit
 * and the in-app tools keep their own action (WhatsApp / open the tool).
 */
function PrimaryCta({ tool, className }) {
  const { cta } = tool;
  if (!tool.free && !cta.href) {
    return (
      <a href="#plans" className={className}>
        View Plans & Pricing <ArrowRight size={16} />
      </a>
    );
  }
  if (cta.href) {
    const LinkTag = cta.needsLogin ? AuthLink : Link;
    return (
      <LinkTag href={cta.href} className={className}>
        {cta.label} <ArrowRight size={16} />
      </LinkTag>
    );
  }
  return (
    <a href={whatsappHref(cta.whatsapp)} target="_blank" rel="noopener noreferrer" className={className}>
      <FaWhatsapp size={18} /> {cta.label}
    </a>
  );
}

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#eab308] px-6 py-3.5 text-sm font-bold text-slate-900 shadow-[0_4px_14px_0_rgba(234,179,8,0.39)] transition-colors hover:bg-[#ca8a04]";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50";

export default async function SeoToolPage({ params }) {
  const { slug } = await params;
  const tool = seoToolBySlug(slug);
  if (!tool) notFound();

  const others = SEO_TOOL_LIST.filter((t) => t.slug !== tool.slug);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {schemasFor(tool).map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <HeaderSection />

      <main className="flex-1">
        {/* HERO */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-sky-50">
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-28 md:px-10 lg:pb-20 lg:pt-32">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm font-medium text-slate-500">
              <Link href="/" className="hover:text-slate-800">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/#tools-website_seo" className="hover:text-slate-800">Website SEO</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-800">{tool.name}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <TileIcon icon={tool.icon} size={22} className="text-current" />
              </span>
              {tool.free ? (
                <span className="rounded-full bg-[#facc15] px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
                  100% Free
                </span>
              ) : (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Website SEO
                </span>
              )}
            </div>

            <h1
              className="mt-5 max-w-3xl font-black leading-[1.08] tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
            >
              {tool.free ? `Free ${tool.name}` : tool.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold text-slate-700">{tool.tagline}</p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-500">{tool.intro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta tool={tool} className={PRIMARY_BTN} />
              <a href={`tel:${PHONE}`} className={SECONDARY_BTN}>
                <Phone size={16} /> {PHONE_LABEL}
              </a>
              {tool.cta.href && (
                <a href="#plans" className={SECONDARY_BTN}>
                  Plans & Pricing
                </a>
              )}
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-600">
              {tool.free ? (
                <>Audit is 100% free. Want us to fix the issues? SEO plans start at {formatInr(minPlanPrice)} + GST.</>
              ) : (
                <>Plans start at {formatInr(minPlanPrice)} + GST · Recommended: {tool.plan}</>
              )}
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">What&apos;s included</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tool.features.map((f) => (
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

        {/* HOW IT WORKS + DELIVERABLES */}
        <section className="bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-2 lg:py-20">
            <div>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">How it works</h2>
              <ol className="mt-8 space-y-4">
                {tool.steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
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
                {tool.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 fill-[#facc15] text-white" /> {d}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-base font-black text-slate-900">Best for</h3>
              <ul className="mt-3 space-y-2">
                {tool.whoFor.map((w) => (
                  <li key={w} className="text-sm text-slate-500">• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* PLANS & PRICING */}
        <section id="plans" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              {tool.free ? "Want us to fix everything we find?" : `${tool.name} plans & pricing`}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              {tool.free
                ? "After your free audit, pick a plan and our SEO team fixes the issues and grows your ranking."
                : `${tool.name} is included in our SEO plans. Pick a plan and pay securely online.`}
            </p>
          </div>
          <SeoPlansCheckout toolName={tool.name} recommended={tool.plan} />
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-14 md:px-10 lg:py-20">
          <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {tool.faqs.map((f) => (
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

        {/* FINAL CTA */}
        <section className="px-6 md:px-10">
          <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-900 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              {tool.free ? "Get your free website audit today" : `Ready to start with ${tool.name}?`}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              {tool.free
                ? "No cost, no obligation — just a clear list of what to fix."
                : "Not sure where to start? Get a free Website Audit first and we'll tell you what your site needs."}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <PrimaryCta tool={tool} className={PRIMARY_BTN} />
              {!tool.free && (
                <Link href="/seo-tools/website-audit" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10">
                  Free Website Audit <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* OTHER SEO TOOLS */}
        <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
          <h2 className="text-2xl font-black text-slate-900">More Website SEO tools</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((t) => (
              <Link
                key={t.slug}
                href={seoToolPath(t)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
      </main>

      <FooterSection />
    </div>
  );
}
