const SITE_URL = "https://www.limbu.ai";

export async function generateMetadata() {
  const canonicalUrl = `${SITE_URL}/google-business-management-service`;

  const title = "Google Business Management Service | Limbu AI";

  const description =
    "Rank higher on Google Maps with Google Business Profile management, local SEO, automated posts, reviews, and optimization services by Limbu AI.";

  const keywords = [
    "Google Business Profile Management Service",
    "Google Business Profile Management",
    "GMB Management",
    "Google Maps SEO",
    "Local SEO Service",
    "Google My Business Optimization",
    "GBP Optimization",
    "Google Business Profile Agency",
    "Local SEO Agency",
    "Google Maps Ranking Service",
    "Limbu AI",
  ];

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Limbu AI",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Layout({ children }) {
  return children;
}