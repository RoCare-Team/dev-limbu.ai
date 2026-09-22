import { findCityBySlug } from "@/utils/citySlug";
import { getCityPageKeywords } from "@/lib/cityPageSeo";
import FranchisePage from "./FranchisePage";
import { notFound } from "next/navigation";

const SITE_URL = "https://www.limbu.ai";

export const revalidate = 86400;

// ✅ Resolve city name from slug
// Returns "" for the base route, null when the city is unknown (→ 404).
function resolveCity(slug = "") {
  // Allow base route
  if (slug === "franchise-opportunities") {
    return "";
  }

  const citySlug = slug.replace("franchise-opportunities-", "");

  if (!citySlug || citySlug.trim() === "") {
    return "";
  }

  return findCityBySlug(citySlug);
}

// ✅ Metadata
export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug || "";

  const cityName = resolveCity(slug);

  // ❌ Invalid route
  if (cityName === null) {
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

    // City pages get city keywords; shared with /api/state-pages (backlinking).
    keywords: getCityPageKeywords("franchise-opportunities", cityName),

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

  const cityName = resolveCity(slug);

  // ❌ Invalid route → 404
  if (cityName === null) {
    notFound();
  }

  return <FranchisePage slug={slug} cityName={cityName} />;
}