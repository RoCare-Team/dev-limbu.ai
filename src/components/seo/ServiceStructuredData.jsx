const SITE_URL = "https://www.limbu.ai";

export default function ServiceStructuredData({
  name,
  description,
  url,
  areaServed,
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: "Limbu.ai",
      url: SITE_URL,
    },
    areaServed: areaServed || "India",
    serviceType: name,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
