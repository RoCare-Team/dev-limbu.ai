import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Terms & Conditions | Limbu.ai",
  description:
    "Read Limbu.ai's terms and conditions for using our AI marketing automation platform, subscription plans, and services.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/terms-and-conditions" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: "https://www.limbu.ai/terms-and-conditions" },
    ],
  },
];

export default function TermsLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
