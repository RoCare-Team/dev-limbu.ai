import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

import DynamicServiceCityPage from "@/components/page-components/CityPage";
import LocalSEOPage from "@/components/page-components/LocalSeo";

import { notFound } from "next/navigation";

const GBP_PREFIX = "google-bussiness-profile-management-";
const OLD_GBP_PREFIX = "google-bussiness-service-";
const LOCAL_SEO_BASE_SLUG = "local-seo";
const LOCAL_SEO_PREFIX = "local-seo-";
const SITE_URL = "https://limbu.ai";
const POPULAR_LOCAL_SEO_CITIES = [
  "Noida",
  "Delhi",
  "Gurugram",
  "Ghaziabad",
  "Faridabad",
  "Mumbai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Jaipur",
  "Lucknow",
];

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

const createLocalSeoCitySlug = (city) => {
  return `${LOCAL_SEO_PREFIX}${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
};

export function generateStaticParams() {
  return POPULAR_LOCAL_SEO_CITIES.map((city) => ({
    slug: createLocalSeoCitySlug(city),
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";

  if (slug === LOCAL_SEO_BASE_SLUG || slug.startsWith(LOCAL_SEO_PREFIX)) {
    const city = extractCity(slug, LOCAL_SEO_PREFIX);
    const cityName = slug === LOCAL_SEO_BASE_SLUG ? "" : formatCityName(city);
    const title = cityName
      ? `${cityName} Local SEO Services | Google Maps Ranking | Limbu.ai`
      : "Local SEO Services | Google Maps Ranking | Limbu.ai";
    const description = cityName
      ? `Grow your ${cityName} business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.`
      : "Grow your local business with Local SEO, Google Business Profile optimization, review automation, and AI-powered Google Maps ranking support from Limbu.ai.";
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

  return {
    title: "Limbu.ai Services",
    description: "AI-powered business growth and local marketing services.",
  };
}

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
      error,
    );

    return {
      success: false,
      data: null,
    };
  }
};

export default async function DynamicServicePage({
  params,
}) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug;

  if (!slug) {
    return notFound();
  }

  // =========================
  // GOOGLE BUSINESS PROFILE
  // =========================
  if (
    slug.startsWith(GBP_PREFIX) ||
    slug.startsWith(OLD_GBP_PREFIX)
  ) {
    const prefix = slug.startsWith(GBP_PREFIX)
      ? GBP_PREFIX
      : OLD_GBP_PREFIX;

    const city = extractCity(slug, prefix);

    const response = await getPageData(city);

    return (
      <DynamicServiceCityPage
        city={city}
        slug={slug}
        pageData={response.data}
        loading={!response.success}
      />
    );
  }

  // =========================
  // LOCAL SEO
  // =========================
  if (slug === LOCAL_SEO_BASE_SLUG) {
    return <LocalSEOPage city="" slug={slug} />;
  }

  if (slug.startsWith(LOCAL_SEO_PREFIX)) {
    const city = extractCity(
      slug,
      LOCAL_SEO_PREFIX,
    );

    return (
      <LocalSEOPage
        city={city}
        slug={slug}
      />
    );
  }

  return notFound();
}
