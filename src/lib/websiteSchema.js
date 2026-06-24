/**
 * Builds a schema.org LocalBusiness JSON-LD object from a generated site's
 * business + AI content. The result is stored on the Site document (schemaData)
 * and injected as a <script type="application/ld+json"> on the live page for SEO.
 */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getSiteUrl(slug) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai";
  if (!slug) return `https://${rootDomain}`;
  return `https://${slug}.${rootDomain}`;
}

export function buildLocalBusinessSchema(business = {}, aiContent = {}, slug = "") {
  if (!business || typeof business !== "object") return null;

  const name = business.title || aiContent?.meta?.title || "Business";
  const url = getSiteUrl(slug);

  const phone =
    business?.phoneNumbers?.primaryPhone || business?.primaryPhone || undefined;

  const locality =
    business?.locality || business?.storefrontAddress?.locality || "";
  const region =
    business?.administrativeArea ||
    business?.storefrontAddress?.administrativeArea ||
    "";
  const postalCode =
    business?.postalCode || business?.storefrontAddress?.postalCode || "";
  const country =
    business?.storefrontAddress?.regionCode || business?.regionCode || "IN";
  const streetAddress =
    business?.storefrontAddress?.addressLines?.[0] || business?.address || "";

  const description =
    aiContent?.meta?.description ||
    aiContent?.about?.content ||
    aiContent?.hero?.subheadline ||
    `${name}${locality ? ` in ${locality}` : ""}`;

  const image = business?.logoUrl || undefined;

  const serviceType = Array.isArray(aiContent?.services)
    ? aiContent.services.map((s) => s?.title).filter(Boolean)
    : [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    ...(image ? { image, logo: image } : {}),
    description,
    ...(phone ? { telephone: phone } : {}),
    priceRange: "₹₹",
  };

  if (locality) {
    schema.areaServed = { "@type": "City", name: locality };
  }

  schema.address = {
    "@type": "PostalAddress",
    ...(streetAddress ? { streetAddress } : {}),
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(postalCode ? { postalCode } : {}),
    addressCountry: country,
  };

  schema.openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAYS,
      opens: "09:00",
      closes: "20:00",
    },
  ];

  const ratingValue = business?.rating || business?.averageRating;
  const reviewCount = business?.reviewCount || business?.userRatingCount;
  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(ratingValue),
      reviewCount: String(reviewCount),
    };
  }

  if (serviceType.length > 0) {
    schema.serviceType = serviceType;
  }

  return schema;
}
