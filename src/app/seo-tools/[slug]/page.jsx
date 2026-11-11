import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import AuthLink from "@/components/AuthLink";
import SeoPlansCheckout from "@/components/seo/SeoPlansCheckout";
import {
  CenteredSection,
  FaqList,
  FeatureGrid,
  FinalCta,
  HowItWorks,
  ON_DARK_BTN,
  PHONE,
  PHONE_LABEL,
  PRIMARY_BTN,
  RelatedLinks,
  SECONDARY_BTN,
  SITE_URL,
  Schemas,
  ServiceHero,
  breadcrumbSchema,
  faqSchema,
  serviceMetadata,
} from "@/components/service-page/ServiceSections";
import { SEO_PLANS, formatInr } from "@/lib/seoPlans";
import { SEO_TOOL_LIST, seoToolBySlug, seoToolPath, whatsappHref } from "@/lib/seoTools";

const SECTION = { label: "Website SEO", href: "/#tools-website_seo" };
const minPlanPrice = Math.min(...SEO_PLANS.map((p) => p.basePrice));
const maxPlanPrice = Math.max(...SEO_PLANS.map((p) => p.basePrice));

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_TOOL_LIST.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = seoToolBySlug(slug);
  if (!tool) return {};
  return serviceMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    url: `${SITE_URL}${seoToolPath(tool)}`,
  });
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
            lowPrice: String(minPlanPrice),
            highPrice: String(maxPlanPrice),
            offerCount: String(SEO_PLANS.length),
          },
    },
    faqSchema(tool.faqs),
    breadcrumbSchema(SECTION, tool.name, url),
  ];
}

/**
 * Primary button: paid services go to the plans on this page; the free audit
 * and the in-app tools keep their own action (WhatsApp / open the tool).
 */
function PrimaryCta({ tool }) {
  const { cta } = tool;
  if (!tool.free && !cta.href) {
    return (
      <a href="#plans" className={PRIMARY_BTN}>
        View Plans & Pricing <ArrowRight size={16} />
      </a>
    );
  }
  if (cta.href) {
    const LinkTag = cta.needsLogin ? AuthLink : Link;
    return (
      <LinkTag href={cta.href} className={PRIMARY_BTN}>
        {cta.label} <ArrowRight size={16} />
      </LinkTag>
    );
  }
  return (
    <a href={whatsappHref(cta.whatsapp)} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}>
      <FaWhatsapp size={18} /> {cta.label}
    </a>
  );
}

export default async function SeoToolPage({ params }) {
  const { slug } = await params;
  const tool = seoToolBySlug(slug);
  if (!tool) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Schemas schemas={schemasFor(tool)} />
      <HeaderSection />

      <main className="flex-1">
        <ServiceHero
          section={SECTION}
          name={tool.name}
          icon={tool.icon}
          badge={
            tool.free ? (
              <span className="rounded-full bg-[#facc15] px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
                100% Free
              </span>
            ) : (
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Website SEO
              </span>
            )
          }
          title={tool.free ? `Free ${tool.name}` : tool.name}
          tagline={tool.tagline}
          intro={tool.intro}
          actions={
            <>
              <PrimaryCta tool={tool} />
              <a href={`tel:${PHONE}`} className={SECONDARY_BTN}>
                <Phone size={16} /> {PHONE_LABEL}
              </a>
              {tool.cta.href && (
                <a href="#plans" className={SECONDARY_BTN}>
                  Plans & Pricing
                </a>
              )}
            </>
          }
          note={
            tool.free
              ? `Audit is 100% free. Want us to fix the issues? SEO plans start at ${formatInr(minPlanPrice)} + GST.`
              : `Plans start at ${formatInr(minPlanPrice)} + GST · Recommended: ${tool.plan}`
          }
        />

        <FeatureGrid features={tool.features} />
        <HowItWorks steps={tool.steps} deliverables={tool.deliverables} whoFor={tool.whoFor} />

        <CenteredSection
          id="plans"
          title={tool.free ? "Want us to fix everything we find?" : `${tool.name} plans & pricing`}
          text={
            tool.free
              ? "After your free audit, pick a plan and our SEO team fixes the issues and grows your ranking."
              : `${tool.name} is included in our SEO plans. Pick a plan and pay securely online.`
          }
        >
          <SeoPlansCheckout toolName={tool.name} recommended={tool.plan} />
        </CenteredSection>

        <FaqList faqs={tool.faqs} />

        <FinalCta
          title={tool.free ? "Get your free website audit today" : `Ready to start with ${tool.name}?`}
          text={
            tool.free
              ? "No cost, no obligation — just a clear list of what to fix."
              : "Not sure where to start? Get a free Website Audit first and we'll tell you what your site needs."
          }
          actions={
            <>
              <PrimaryCta tool={tool} />
              {!tool.free && (
                <Link href="/seo-tools/website-audit" className={ON_DARK_BTN}>
                  Free Website Audit <ArrowRight size={16} />
                </Link>
              )}
            </>
          }
        />

        <RelatedLinks
          title="More Website SEO tools"
          items={SEO_TOOL_LIST.filter((t) => t.slug !== tool.slug).map((t) => ({
            href: seoToolPath(t),
            name: t.name,
            icon: t.icon,
            free: t.free,
          }))}
        />
      </main>

      <FooterSection />
    </div>
  );
}
