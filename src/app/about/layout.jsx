import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "About Limbu.ai | AI Marketing for Local Business",
  description:
    "Learn how Limbu.ai helps local businesses dominate Google search with AI-powered GMB automation, review management, and local SEO tools.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/about" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "About", item: "https://www.limbu.ai/about" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Limbu.ai",
    description:
      "Limbu.ai is an AI-powered marketing automation platform that helps local businesses grow on Google, Facebook, and Instagram.",
    url: "https://www.limbu.ai/about",
    publisher: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
  },
];

export default function AboutLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
