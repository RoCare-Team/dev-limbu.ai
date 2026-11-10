import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import SchemaMarkup from "@/components/SchemaMarkup";
import WebDevHero from "@/components/website-development/WebDevHero";
import WebServices from "@/components/website-development/WebServices";
import WebPricing from "@/components/website-development/WebPricing";
import WebProcess from "@/components/website-development/WebProcess";
import WebFaq, { WEB_FAQS } from "@/components/website-development/WebFaq";
import { WEB_DEVELOPMENT_PLANS } from "@/lib/webPlans";

const URL = "https://www.limbu.ai/website-development";

export const metadata = {
  title: "Website Development for Local Businesses | Plans from ₹9,999 | Limbu.ai",
  description:
    "Mobile-friendly, SEO-ready websites and online stores for local businesses. Starter from ₹9,999, Business ₹25,000, Enterprise with e-commerce ₹48,000.",
  alternates: { canonical: URL },
  robots: { index: true, follow: true },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Website Development",
    provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
    areaServed: "India",
    url: URL,
    offers: WEB_DEVELOPMENT_PLANS.map((p) => ({
      "@type": "Offer",
      name: p.title,
      price: p.basePrice,
      priceCurrency: "INR",
      description: p.description,
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: WEB_FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

export default function WebsiteDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <SchemaMarkup schemas={schemas} />
      <HeaderSection />
      {/* Space for the fixed navbar */}
      <div className="h-[65px]" aria-hidden="true" />

      <WebDevHero />
      <WebServices />
      <WebPricing />
      <WebProcess />
      <WebFaq />

      <FooterSection />
    </div>
  );
}
