import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Franchise Opportunities | Limbu.ai",
  description:
    "Join the Limbu.ai franchise network. Earn by selling AI marketing automation to local businesses in your city. Low investment, high returns.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/franchise-opportunities" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Franchise Opportunities", item: "https://www.limbu.ai/franchise-opportunities" },
    ],
  },
];

export default function FranchiseLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
