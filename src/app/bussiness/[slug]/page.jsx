import { POPULAR_CITIES } from "@/utils/popularCity";
import FranchisePage from "./FranchisePage";
import { notFound } from "next/navigation";

const SITE_URL = "https://limbu.ai";



// ✅ Create slug from city
function createFranchiseCitySlug(city) {
  return `franchise-opportunities-${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

// ✅ Extract city name from slug
function getCityNameFromSlug(slug = "") {
  // Allow base route
  if (slug === "franchise-opportunities") {
    return "";
  }

  const citySlug = slug.replace("franchise-opportunities-", "");

  if (!citySlug || citySlug.trim() === "") {
    return "";
  }

  return citySlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ✅ Generate static pages
export function generateStaticParams() {
  return [
    // Base route
    {
      slug: "franchise-opportunities",
    },

    // City routes
    ...POPULAR_CITIES.map((city) => ({
      slug: createFranchiseCitySlug(city),
    })),
  ];
}

// ✅ Validate route
function validateRoute(slug, cityName) {
  // Allow base route
  if (slug === "franchise-opportunities") {
    return true;
  }

  // Allow valid cities only
  return POPULAR_CITIES.some(
    (city) => city.toLowerCase() === cityName.toLowerCase()
  );
}

// ✅ Metadata
export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug || "";

  const cityName = getCityNameFromSlug(slug);

  // ❌ Invalid route
  if (!validateRoute(slug, cityName)) {
    notFound();
  }

  // ✅ Dynamic title
  const title = cityName
    ? `${cityName} Franchise Opportunities | Business Franchise | Limbu.ai`
    : "AI Business Franchise Opportunities | Business Franchise | Limbu.ai";

  // ✅ Dynamic description
  const description = cityName
    ? `Start your AI-powered franchise business in ${cityName} with Limbu.ai. Offer Google Business Profile management, local SEO, review automation, and AI marketing services to local businesses.`
    : "Start your AI-powered franchise business with Limbu.ai. Offer Google Business Profile management, local SEO, review automation, and AI marketing services to local businesses.";

  // ✅ Canonical
  const canonicalUrl = `${SITE_URL}/bussiness/${slug}`;

  return {
    metadataBase: new URL(SITE_URL),

    title,

    description,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
    },

    authors: [
      {
        name: "Limbu.ai",
        url: "https://www.limbu.ai/",
      },
    ],

    publisher: "Limbu.ai",

    keywords: [
      "AI franchise business",
      "franchise opportunities",
      "Google Business Profile services",
      "local SEO franchise",
      "GMB management franchise",
      "AI marketing franchise",
      "business automation franchise",
      "review management services",
      "digital marketing franchise India",
      "Limbu.ai franchise",
    ],

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

// ✅ Page
export default async function Page({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug || "";

  const cityName = getCityNameFromSlug(slug);

  // ❌ Invalid route → 404
  if (!validateRoute(slug, cityName)) {
    notFound();
  }

  return <FranchisePage params={params} />;
}