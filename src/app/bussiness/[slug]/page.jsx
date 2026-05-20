import FranchisePage from "./FranchisePage";

const SITE_URL = "https://limbu.ai";
const POPULAR_FRANCHISE_CITIES = [
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

function createFranchiseCitySlug(city) {
  return `franchise-opportunities-${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function getCityNameFromSlug(slug = "") {
  const citySlug = slug.replace("franchise-opportunities-", "");

  return citySlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return POPULAR_FRANCHISE_CITIES.map((city) => ({
    slug: createFranchiseCitySlug(city),
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const slug = resolvedParams?.slug || "";

  const cityName = getCityNameFromSlug(slug);

  // ================= TITLE =================

  const title = cityName
    ? `${cityName} Franchise Opportunities | Business Franchise | Limbu.ai`
    : "AI Business Franchise Opportunities | Limbu.ai";

  // ================= DESCRIPTION =================

  const description = cityName
    ? `Start your AI-powered franchise business in ${cityName} with Limbu.ai. Offer Google Business Profile management, local SEO, review automation, and AI marketing services to local businesses.`
    : "Start your AI-powered franchise business with Limbu.ai. Offer Google Business Profile management, local SEO, review automation, and AI marketing services to local businesses.";

  // ================= CANONICAL =================

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

export default async function Page({ params }) {
  return <FranchisePage params={params} />;
}
