import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Cancellation Policy | Limbu.ai",
  description:
    "Read Limbu.ai's cancellation and refund policy for subscription plans and one-time services.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/cancellation-policy" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Cancellation Policy", item: "https://www.limbu.ai/cancellation-policy" },
    ],
  },
];

export default function CancellationLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
