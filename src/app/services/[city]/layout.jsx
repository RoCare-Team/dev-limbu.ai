import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

const CITY_SERVICE_PREFIX = "google-bussiness-profile-management-";
const OLD_CITY_SERVICE_PREFIX = "google-bussiness-service-";

const SITE_URL = "https://www.limbu.ai";

const getCityNameFallback = (citySlug = "") => {
  const matchedPrefix = [CITY_SERVICE_PREFIX, OLD_CITY_SERVICE_PREFIX].find(
    (prefix) => citySlug.startsWith(prefix),
  );

  const rawCity = matchedPrefix
    ? citySlug.slice(matchedPrefix.length)
    : citySlug;

  return rawCity
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const findCityPage = async (slug) => {
  await dbConnect();

  return CityServicePage.findOne({
    $or: [
      { citySlug: slug },
      { citySlug: `${CITY_SERVICE_PREFIX}${slug}` },
      { citySlug: `${OLD_CITY_SERVICE_PREFIX}${slug}` },
    ],
    isActive: true,
  }).lean();
};

export async function generateMetadata({ params }) {
  const { city } = await params;

  const cityNameFallback = getCityNameFallback(city);

  const canonicalUrl = `${SITE_URL}/services/${city}`;

  try {
    const page = await findCityPage(city);

    const cityName = page?.cityName || cityNameFallback;

    const title =
      page?.metaTitle || `${cityName} | Google Business Management Service`;

    // 120-320 CHARACTERS SEO DESCRIPTION
    const description =
      page?.metaDescription ||
      `Boost your local visibility in ${cityName} with Limbu AI’s Google Business Profile management services. Get higher Google Maps rankings, automated GMB posts, review management, local SEO optimization, customer engagement tools, and business growth solutions designed for local businesses.`;

    const allowIndex = page?.allowIndex !== false;

    const keywords = page?.metaKeywords || [
      `Google Business Profile Management Service ${cityName}`,
      `GMB Management Service ${cityName}`,
      `Google Maps SEO ${cityName}`,
      `Local SEO Service ${cityName}`,
      `GBP Optimization ${cityName}`,
      `Google My Business Expert ${cityName}`,
      `GMB Ranking Service ${cityName}`,
      `Google Business Profile Agency ${cityName}`,
      `Local Business Marketing ${cityName}`,
      "Limbu AI",
    ];

    return {
      metadataBase: new URL(SITE_URL),

      title,
      description,
      keywords,

      authors: [
        {
          name: "Limbu AI",
          url: SITE_URL,
        },
      ],

      creator: "Limbu AI",

      publisher: "Limbu AI",

      alternates: {
        canonical: canonicalUrl,
      },

      robots: {
        index: allowIndex,
        follow: allowIndex,
        googleBot: {
          index: allowIndex,
          follow: allowIndex,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Limbu AI",
        locale: "en_US",
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title,
        description,
      },

      category: "Local SEO",
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),

      title: `${cityNameFallback} | Google Business Management Service`,

      description: `Improve local rankings in ${cityNameFallback} using Google Business Profile optimization, review management, and local SEO services by Limbu AI.`,

      keywords: [
        `Google Business Profile Management Service ${cityNameFallback}`,
        `GMB Management Service ${cityNameFallback}`,
        `Google Maps SEO ${cityNameFallback}`,
      ],

      authors: [
        {
          name: "Limbu AI",
          url: SITE_URL,
        },
      ],

      creator: "Limbu AI",

      publisher: "Limbu AI",

      alternates: {
        canonical: canonicalUrl,
      },

      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default function CityServiceLayout({ children }) {
  return children;
}
