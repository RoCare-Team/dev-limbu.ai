
import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

import DynamicServiceCityPage from "@/components/page-components/CityPage";
import LocalSEOPage from "@/components/page-components/LocalSeo";
import GbpNationalServicePage from "@/components/page-components/GbpNationalServicePage";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";

import { notFound } from "next/navigation";
import { POPULAR_CITIES } from "@/utils/popularCity";

const GBP_PREFIX = "google-bussiness-profile-management-";
const GBP_BASE_SLUG = "google-bussiness-profile-management";
const OLD_GBP_PREFIX = "google-bussiness-service-";

const LOCAL_SEO_BASE_SLUG = "local-seo";
const LOCAL_SEO_PREFIX = "local-seo-";

const SITE_URL = "https://www.limbu.ai";

export const revalidate = 86400;

const POPULAR_LOCAL_SEO_CITIES = POPULAR_CITIES;

// =========================
// HELPERS
// =========================

const extractCity = (slug = "", prefix = "") => {
  return slug.replace(prefix, "");
};

const formatCityName = (city = "") => {
  return city
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const normalizeCity = (city = "") => {
  return city.trim().toLowerCase();
};

const isValidCity = (city = "") => {
  return POPULAR_LOCAL_SEO_CITIES.some(
    (c) => normalizeCity(c) === normalizeCity(formatCityName(city))
  );
};

// =========================
// METADATA
// =========================

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug || "";

  // =========================
  // GBP NATIONAL PAGE
  // =========================

  if (slug === GBP_BASE_SLUG) {
    const canonicalUrl = `${SITE_URL}/services/${slug}`;

    return {
      metadataBase: new URL(SITE_URL),
      title:
        "Google Business Profile Management Services | Google Maps SEO | Limbu.ai",
      description:
        "Manage and grow your Google Business Profile with AI-powered posts, reviews, local SEO, and Google Maps ranking support across India from Limbu.ai.",
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title:
          "Google Business Profile Management Services | Google Maps SEO | Limbu.ai",
        description:
          "Manage and grow your Google Business Profile with AI-powered posts, reviews, local SEO, and Google Maps ranking support across India from Limbu.ai.",
        url: canonicalUrl,
        siteName: "Limbu.ai",
        type: "website",
        locale: "en_IN",
      },
      twitter: {
        card: "summary_large_image",
        title:
          "Google Business Profile Management Services | Google Maps SEO | Limbu.ai",
        description:
          "Manage and grow your Google Business Profile with AI-powered posts, reviews, local SEO, and Google Maps ranking support across India from Limbu.ai.",
      },
    };
  }

  // =========================
  // LOCAL SEO
  // =========================

  if (slug === LOCAL_SEO_BASE_SLUG) {
    const canonicalUrl = `${SITE_URL}/services/${slug}`;

    return {
      metadataBase: new URL(SITE_URL),

      title:
        "Local SEO Services | Google Maps Ranking | Limbu.ai",

      description:
        "Grow your local business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.",

      alternates: {
        canonical: canonicalUrl,
      },

      openGraph: {
        title:
          "Local SEO Services | Google Maps Ranking | Limbu.ai",

        description:
          "Grow your local business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.",

        url: canonicalUrl,

        siteName: "Limbu.ai",

        type: "website",

        locale: "en_IN",
      },

      twitter: {
        card: "summary_large_image",

        title:
          "Local SEO Services | Google Maps Ranking | Limbu.ai",

        description:
          "Grow your local business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.",
      },
    };
  }

  // =========================
  // LOCAL SEO CITY PAGE
  // =========================

  if (slug.startsWith(LOCAL_SEO_PREFIX)) {
    const city = extractCity(
      slug,
      LOCAL_SEO_PREFIX
    );

    // ❌ Invalid city
    if (!isValidCity(city)) {
      notFound();
    }

    const cityName = formatCityName(city);

    const title = `${cityName} Local SEO Services | Google Maps Ranking | Limbu.ai`;

    const description = `Grow your ${cityName} business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.`;

    const canonicalUrl = `${SITE_URL}/services/${slug}`;

    return {
      metadataBase: new URL(SITE_URL),

      title,

      description,

      alternates: {
        canonical: canonicalUrl,
      },

      openGraph: {
        title,

        description,

        url: canonicalUrl,

        siteName: "Limbu.ai",

        type: "website",

        locale: "en_IN",
      },

      twitter: {
        card: "summary_large_image",

        title,

        description,
      },
    };
  }

  // =========================
  // GBP / OLD GBP
  // =========================

  if (
    slug.startsWith(GBP_PREFIX) ||
    slug.startsWith(OLD_GBP_PREFIX)
  ) {
    const prefix = slug.startsWith(GBP_PREFIX)
      ? GBP_PREFIX
      : OLD_GBP_PREFIX;

    const city = extractCity(slug, prefix);

    // ❌ Invalid city
    if (!isValidCity(city)) {
      notFound();
    }

    const cityName = formatCityName(city);

    const title = `${cityName} Google Business Profile Management Services | Limbu.ai`;

    const description = `Boost your ${cityName} business visibility with AI-powered Google Business Profile management, SEO optimization, reviews, and local ranking support from Limbu.ai.`;

    const canonicalUrl = `${SITE_URL}/services/${slug}`;

    return {
      metadataBase: new URL(SITE_URL),

      title,

      description,

      alternates: {
        canonical: canonicalUrl,
      },

      openGraph: {
        title,

        description,

        url: canonicalUrl,

        siteName: "Limbu.ai",

        type: "website",

        locale: "en_IN",
      },

      twitter: {
        card: "summary_large_image",

        title,

        description,
      },
    };
  }

  // ❌ Invalid route
  return notFound();
}

// =========================
// FETCH PAGE DATA
// =========================

const getPageData = async (city) => {
  try {
    await dbConnect();

    const page = await CityServicePage.findOne({
      $or: [
        { citySlug: city },

        {
          citySlug: `${GBP_PREFIX}${city}`,
        },

        {
          citySlug: `${OLD_GBP_PREFIX}${city}`,
        },

        {
          citySlug: `${LOCAL_SEO_PREFIX}${city}`,
        },
      ],

      isActive: true,
    }).lean();

    return {
      success: true,
      data: page || null,
    };
  } catch (error) {
    console.error(
      "Failed to fetch city page:",
      error
    );

    return {
      success: false,
      data: null,
    };
  }
};

// =========================
// PAGE
// =========================

export default async function DynamicServicePage({
  params,
}) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug;

  if (!slug) {
    return notFound();
  }

  // =========================
  // GBP NATIONAL PAGE
  // =========================

  if (slug === GBP_BASE_SLUG) {
    const pageUrl = `${SITE_URL}/services/${slug}`;

    return (
      <>
        <ServiceStructuredData
          name="Google Business Profile Management Services"
          description="AI-powered Google Business Profile management, local SEO, review automation, and Google Maps ranking support across India."
          url={pageUrl}
          areaServed="India"
        />
        <GbpNationalServicePage />
      </>
    );
  }

  // =========================
  // GOOGLE BUSINESS PROFILE (CITY)
  // =========================

  if (slug.startsWith(GBP_PREFIX) || slug.startsWith(OLD_GBP_PREFIX)) {
    const prefix = slug.startsWith(GBP_PREFIX) ? GBP_PREFIX : OLD_GBP_PREFIX;

    const city = extractCity(slug, prefix);

    if (!isValidCity(city)) {
      return notFound();
    }

    const cityName = formatCityName(city);
    const response = await getPageData(city);
    const pageUrl = `${SITE_URL}/services/${slug}`;

    return (
      <>
        <ServiceStructuredData
          name={`Google Business Profile Management in ${cityName}`}
          description={`Boost your ${cityName} business visibility with AI-powered Google Business Profile management, SEO optimization, reviews, and local ranking support from Limbu.ai.`}
          url={pageUrl}
          areaServed={cityName}
        />
        <DynamicServiceCityPage
          city={city}
          slug={slug}
          pageData={response.data}
        />
      </>
    );
  }

  // =========================
  // LOCAL SEO BASE PAGE
  // =========================

  if (slug === LOCAL_SEO_BASE_SLUG) {
    const pageUrl = `${SITE_URL}/services/${slug}`;

    return (
      <>
        <ServiceStructuredData
          name="Local SEO Services"
          description="Grow your local business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai."
          url={pageUrl}
          areaServed="India"
        />
        <LocalSEOPage city="" slug={slug} />
      </>
    );
  }

  // =========================
  // LOCAL SEO CITY PAGE
  // =========================

  if (slug.startsWith(LOCAL_SEO_PREFIX)) {
    const city = extractCity(slug, LOCAL_SEO_PREFIX);

    if (!isValidCity(city)) {
      return notFound();
    }

    const cityName = formatCityName(city);
    const pageUrl = `${SITE_URL}/services/${slug}`;

    return (
      <>
        <ServiceStructuredData
          name={`Local SEO Services in ${cityName}`}
          description={`Grow your ${cityName} business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.`}
          url={pageUrl}
          areaServed={cityName}
        />
        <LocalSEOPage city={city} slug={slug} />
      </>
    );
  }

  // ❌ Invalid route
  return notFound();
}