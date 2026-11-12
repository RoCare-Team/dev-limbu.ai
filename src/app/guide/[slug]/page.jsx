import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import GuideIcon, { SERVICE_ICONS } from "@/components/guide/GuideIcon";
import { SERVICE_GUIDES, guideBySlug, guidePath } from "@/lib/serviceGuides";

export const generateStaticParams = () => SERVICE_GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) return {};
  const url = `https://www.limbu.ai${guidePath(guide)}`;
  return {
    title: `${guide.title} | Limbu AI Guide`,
    description: guide.intro,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.intro, url, siteName: "Limbu.ai", type: "article" },
  };
}

/** A button or link; external ones (WhatsApp) open in a new tab. */
function ActionLink({ action, className, children }) {
  return action.external ? (
    <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={action.href} className={className}>
      {children}
    </Link>
  );
}

export default async function GuidePage({ params }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();
  const others = SERVICE_GUIDES.filter((g) => g.key !== guide.key);
  const ServiceIcon = SERVICE_ICONS[guide.key];

  // HowTo structured data for search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.intro,
    step: guide.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HeaderSection />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-28 sm:px-6">
        <nav className="mb-6 flex items-center gap-1 text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
          <Link href="/guide" className="hover:text-slate-900">
            Guides
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-900">{guide.name}</span>
        </nav>

        <header className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-800">
            {ServiceIcon && <ServiceIcon size={14} />} {guide.name}
          </span>
          <h1
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {guide.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-600">{guide.intro}</p>
        </header>

        <ol className="relative space-y-4 border-l-2 border-yellow-200 pl-6 sm:pl-8">
          {guide.steps.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[37px] top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#facc15] text-xs font-black text-black ring-4 ring-white sm:-left-[45px]">
                {i + 1}
              </span>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700 sm:flex">
                    <GuideIcon name={step.icon} size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">{step.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
                    {step.action && (
                      <ActionLink
                        action={step.action}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-[#facc15]"
                      >
                        {step.action.label} <ArrowRight size={12} />
                      </ActionLink>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {guide.more?.length > 0 && (
          <section className="mt-10 rounded-2xl bg-slate-50 p-6">
            <h2 className="text-base font-bold text-slate-900">Detailed guides</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {guide.more.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-slate-900 p-8 text-center">
          <p className="text-lg font-bold text-white">Ready to get started?</p>
          <ActionLink
            action={guide.cta}
            className="inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-6 py-3 text-sm font-black text-black hover:bg-[#fde047]"
          >
            {guide.cta.label} <ArrowRight size={16} />
          </ActionLink>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-base font-bold text-slate-900">Guides for other services</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((g) => {
              const Icon = SERVICE_ICONS[g.key];
              return (
                <Link
                  key={g.key}
                  href={guidePath(g)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-900"
                >
                  {Icon && <Icon size={16} className="shrink-0 text-yellow-600" />}
                  {g.name}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
