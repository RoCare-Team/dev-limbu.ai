import { notFound } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import AdPlanCheckout from "@/components/ads/AdPlanCheckout";
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
import { formatInr } from "@/lib/seoPlans";
import { whatsappHref } from "@/lib/seoTools";
import { AD_SERVICE_LIST, adPlanByTitle, adServiceBySlug, adServicePath } from "@/lib/adServices";

const SECTION = { label: "Paid Ads", href: "/#tools-paid_ads" };

export const dynamicParams = false;

export function generateStaticParams() {
  return AD_SERVICE_LIST.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = adServiceBySlug(slug);
  if (!service) return {};
  return serviceMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    url: `${SITE_URL}${adServicePath(service)}`,
  });
}

function schemasFor(service, plan) {
  const url = `${SITE_URL}${adServicePath(service)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${service.name} Management`,
      description: service.metaDescription,
      url,
      serviceType: "Online advertising",
      areaServed: "India",
      provider: { "@type": "Organization", name: "Limbu.ai", url: SITE_URL },
      ...(plan && { offers: { "@type": "Offer", price: String(plan.basePrice), priceCurrency: "INR" } }),
    },
    faqSchema(service.faqs),
    breadcrumbSchema(SECTION, service.name, url),
  ];
}

/** Platforms with a setup plan go to the plan below; the rest open a WhatsApp enquiry. */
function PrimaryCta({ service, plan }) {
  if (plan) {
    return (
      <a href="#plans" className={PRIMARY_BTN}>
        Get Started at {formatInr(plan.basePrice)} <ArrowRight size={16} />
      </a>
    );
  }
  return (
    <a href={whatsappHref(service.cta.whatsapp)} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}>
      <FaWhatsapp size={18} /> Get a Free Plan
    </a>
  );
}

export default async function AdServicePage({ params }) {
  const { slug } = await params;
  const service = adServiceBySlug(slug);
  if (!service) notFound();
  const plan = adPlanByTitle(service.plan);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Schemas schemas={schemasFor(service, plan)} />
      <HeaderSection />

      <main className="flex-1">
        <ServiceHero
          section={SECTION}
          name={service.name}
          icon={service.icon}
          badge={
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Paid Ads
            </span>
          }
          title={`${service.name} for Local Businesses`}
          tagline={service.tagline}
          intro={service.intro}
          actions={
            <>
              <PrimaryCta service={service} plan={plan} />
              <a href={`tel:${PHONE}`} className={SECONDARY_BTN}>
                <Phone size={16} /> {PHONE_LABEL}
              </a>
            </>
          }
          note={
            plan
              ? `${plan.title}: ${formatInr(plan.basePrice)} + GST one-time · Ad spend is paid directly to the platform`
              : "Tell us your goal and audience, and we will share a plan and quote."
          }
        />

        <FeatureGrid features={service.features} />
        <HowItWorks steps={service.steps} deliverables={service.deliverables} whoFor={service.whoFor} />

        {plan && (
          <CenteredSection
            id="plans"
            title={`Start with ${service.name}`}
            text={`${service.name} runs on the ${plan.title}. Pay securely online and our team gets in touch to set it up.`}
          >
            <AdPlanCheckout plan={plan} />
          </CenteredSection>
        )}

        <FaqList faqs={service.faqs} />

        <FinalCta
          title={`Ready to get leads from ${service.name}?`}
          text="Not sure which platform fits your business? Message us and we will suggest the best start for your budget."
          actions={
            <>
              <PrimaryCta service={service} plan={plan} />
              {plan && (
                <a href={whatsappHref(service.cta.whatsapp)} target="_blank" rel="noopener noreferrer" className={ON_DARK_BTN}>
                  <FaWhatsapp size={18} /> Talk to an expert
                </a>
              )}
            </>
          }
        />

        <RelatedLinks
          title="More ad platforms"
          items={AD_SERVICE_LIST.filter((s) => s.slug !== service.slug).map((s) => ({
            href: adServicePath(s),
            name: s.name,
            icon: s.icon,
          }))}
        />
      </main>

      <FooterSection />
    </div>
  );
}
