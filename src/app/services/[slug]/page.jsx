import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";

import DynamicServiceCityPage from "@/components/page-components/CityPage";
import LocalSEOPage from "@/components/page-components/LocalSeo";

import { notFound } from "next/navigation";

const GBP_PREFIX = "google-bussiness-profile-management-";
const OLD_GBP_PREFIX = "google-bussiness-service-";
const LOCAL_SEO_PREFIX = "local-seo-";

const extractCity = (slug = "", prefix = "") => {
  return slug.replace(prefix, "");
};

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