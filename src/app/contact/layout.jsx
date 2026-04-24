import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Contact Limbu.ai | Talk to Our Team",
  description:
    "Get in touch with Limbu.ai. Call +91-9289344726, email info@limbu.ai, or fill the form to start growing your local business today.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/contact" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Contact", item: "https://www.limbu.ai/contact" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Limbu.ai",
    description: "Reach out to Limbu.ai for support, sales, or partnership enquiries.",
    url: "https://www.limbu.ai/contact",
    publisher: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
  },
];

export default function ContactLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
