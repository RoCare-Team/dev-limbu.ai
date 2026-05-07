import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

const CITY_SERVICE_PREFIX = "google-bussiness-profile-management-";
const OLD_CITY_SERVICE_PREFIX = "google-bussiness-service-";

const getCityNameFallback = (citySlug = "") => {
  const matchedPrefix = [CITY_SERVICE_PREFIX, OLD_CITY_SERVICE_PREFIX].find((prefix) =>
    citySlug.startsWith(prefix)
  );
  const rawCity = matchedPrefix ? citySlug.slice(matchedPrefix.length) : citySlug;

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

  try {
    const page = await findCityPage(city);
    const cityName = page?.cityName || cityNameFallback;
    const title = page?.metaTitle || `${cityName} | Google Business Management Service`;
    const description =
      page?.metaDescription ||
      `Rank #1 on Google Maps in ${cityName}. Get automated GMB posts, 5-star reviews, and local SEO services with Limbu AI.`;
    const allowIndex = page?.allowIndex !== false;

    return {
      title,
      description,
      robots: {
        index: allowIndex,
        follow: allowIndex,
      },
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return {
      title: `${cityNameFallback} | Google Business Management Service`,
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
