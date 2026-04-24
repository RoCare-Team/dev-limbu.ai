import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Pricing Plans | GMB Marketing Tools | Limbu.ai",
  description:
    "Explore Limbu.ai pricing for GMB automation, review management, local SEO, and web development. Transparent plans starting at ₹2,500/month.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/pricing" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Pricing", item: "https://www.limbu.ai/pricing" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Limbu.ai Pricing Plans",
    description: "AI-powered GMB automation and marketing subscription plans for local businesses.",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Product",
          name: "Basic Plan",
          description: "Ideal for small businesses needing basic online presence. Includes 15 GMB posts, 5 citations, review reply system, Magic QR, and insights dashboard.",
          brand: { "@type": "Brand", name: "Limbu.ai" },
          offers: {
            "@type": "Offer",
            price: "2950",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Limbu.ai" },
          },
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Product",
          name: "Professional Plan",
          description: "Best for growing businesses. Includes 30 GMB posts, 12 citations, review management, Magic QR, and website builder.",
          brand: { "@type": "Brand", name: "Limbu.ai" },
          offers: {
            "@type": "Offer",
            price: "6490",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Limbu.ai" },
          },
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Product",
          name: "Premium Plan",
          description: "Perfect for brands focused on automation and maximum reach. Includes 45 GMB posts, 15 citations, and all Pro features plus professional services.",
          brand: { "@type": "Brand", name: "Limbu.ai" },
          offers: {
            "@type": "Offer",
            price: "8850",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Limbu.ai" },
          },
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is included in the Basic Plan?",
        acceptedAnswer: { "@type": "Answer", text: "The Basic Plan includes 15 GMB posts per month, 5 citations, review reply system, Magic QR code generation, insights dashboard, category optimization, and a website builder for ₹2,950/month (incl. GST)." },
      },
      {
        "@type": "Question",
        name: "Can I upgrade or change my plan later?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. You can upgrade from Basic to Professional or Premium at any time. Contact our team at info@limbu.ai or WhatsApp +91-9289344726 to make a change." },
      },
      {
        "@type": "Question",
        name: "Is there a discount for quarterly or yearly plans?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. Quarterly plans get a 10% discount, half-yearly plans get a 15% discount, and yearly plans get a 20% discount on the base price." },
      },
      {
        "@type": "Question",
        name: "What is the GMB Creation & Management Plan?",
        acceptedAnswer: { "@type": "Answer", text: "The GMB Creation plan (₹3,540 incl. GST) is a one-time service for creating a Google Business Profile from scratch, including address verification, category selection, product listing, and 1 month of support." },
      },
    ],
  },
];

export default function PricingLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
