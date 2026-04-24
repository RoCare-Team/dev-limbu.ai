import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Privacy Policy | Limbu.ai",
  description:
    "Read Limbu.ai's privacy policy. Learn how we collect, use, and protect your personal data when you use our AI marketing automation platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/privacy-policy" },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
      { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://www.limbu.ai/privacy-policy" },
    ],
  },
];

export default function PrivacyPolicyLayout({ children }) {
  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {children}
    </>
  );
}
