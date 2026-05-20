import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

const SITE_URL = "https://www.limbu.ai";

const GBP_PREFIX = "google-bussiness-profile-management-";
const OLD_GBP_PREFIX = "google-bussiness-service-";
const LOCAL_SEO_PREFIX = "local-seo-";

const getPageType = (slug = "") => {
  if (slug.startsWith(GBP_PREFIX) || slug.startsWith(OLD_GBP_PREFIX)) {
    return "google-business";
  }

  if (slug.startsWith(LOCAL_SEO_PREFIX)) {
    return "local-seo";
  }

  return null;
};

const getCityNameFallback = (slug = "") => {
  const matchedPrefix = [GBP_PREFIX, OLD_GBP_PREFIX, LOCAL_SEO_PREFIX].find(
    (prefix) => slug.startsWith(prefix),
  );

  const rawCity = matchedPrefix ? slug.slice(matchedPrefix.length) : slug;

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

      // GBP
      { citySlug: `${GBP_PREFIX}${slug}` },
      { citySlug: `${OLD_GBP_PREFIX}${slug}` },

      // LOCAL SEO
      { citySlug: `${LOCAL_SEO_PREFIX}${slug}` },
    ],
    isActive: true,
  }).lean();
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug;

  if (!slug) {
    return {};
  }

  const pageType = getPageType(slug);

  if (!pageType) {
    return {};
  }

  // Extract City
  const matchedPrefix = [GBP_PREFIX, OLD_GBP_PREFIX, LOCAL_SEO_PREFIX].find(
    (prefix) => slug.startsWith(prefix),
  );

  const rawCity = matchedPrefix ? slug.slice(matchedPrefix.length) : slug;

  // Capitalized City
  const cityNameFallback = rawCity
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // PERFECT CANONICAL
  const canonicalUrl = `${SITE_URL}/services/${slug}`;

  try {
    await dbConnect();

    // FIND BY RAW CITY
    const page = await CityServicePage.findOne({
      $or: [
        { citySlug: rawCity },

        {
          citySlug: slug,
        },

        {
          citySlug: `${GBP_PREFIX}${rawCity}`,
        },

        {
          citySlug: `${OLD_GBP_PREFIX}${rawCity}`,
        },

        {
          citySlug: `${LOCAL_SEO_PREFIX}${rawCity}`,
        },
      ],

      isActive: true,
    }).lean();

    const cityName = page?.cityName || cityNameFallback;

    const isLocalSEO = pageType === "local-seo";

    // =========================
    // TITLE
    // =========================
    const defaultTitle = isLocalSEO
      ? `Local SEO Services in ${cityName} | Google Maps Ranking`
      : `Google Business Profile Management in ${cityName} | Limbu.ai`;

    const title = page?.metaTitle || defaultTitle;

    // =========================
    // DESCRIPTION
    // =========================
    const defaultDescription = isLocalSEO
      ? `Improve your Google Maps rankings in ${cityName} with Limbu.ai Local SEO services. Optimize your Google Business Profile, manage reviews, and grow local visibility.`
      : `Boost your Google Business Profile rankings in ${cityName} with Limbu.ai. Automate GMB posts, manage reviews, improve local SEO, and increase Google Maps visibility.`;

    const description = page?.metaDescription || defaultDescription;

    // =========================
    // KEYWORDS
    // =========================
    const keywords = page?.metaKeywords || [
      isLocalSEO
        ? `Local SEO Services ${cityName}`
        : `Google Business Profile Management ${cityName}`,

      `Google Maps SEO ${cityName}`,

      `Google Business Optimization ${cityName}`,

      `GMB Management ${cityName}`,

      `Local Business SEO ${cityName}`,

      "Limbu.ai",
    ];

    const allowIndex = page?.allowIndex !== false;

    return {
      metadataBase: new URL(SITE_URL),

      title,

      description,

      keywords,

      alternates: {
        canonical: canonicalUrl,
      },

      robots: {
        index: allowIndex,
        follow: allowIndex,
      },

      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Limbu.ai",
        locale: "en_US",
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Metadata Error:", error);

    return {
      title: `Google Business Services in ${cityNameFallback} | Limbu.ai`,

      description: `Improve your Google Maps visibility in ${cityNameFallback} using AI-powered local SEO and Google Business optimization services.`,

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

export default function DynamicServiceLayout({ children }) {
  return children;
}
