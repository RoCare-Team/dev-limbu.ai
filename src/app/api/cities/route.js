import { NextResponse } from "next/server";
import { findCityBySlug, getCitySlugs } from "@/utils/citySlug";
import { SEO_SITE_URL } from "@/lib/cityPageSeo";

/**
 * GET /api/cities[?search=noida]
 *
 * Every city limbu.ai has landing pages for — the same list the sitemap and
 * /api/state-pages use. Pass a city's `name` to /api/state-pages to get its URLs.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  let cities = getCitySlugs().map((slug) => {
    const name = findCityBySlug(slug);
    return {
      name,
      slug,
      pagesApi: `${SEO_SITE_URL}/api/state-pages?city=${encodeURIComponent(name)}`,
    };
  });

  if (search) {
    cities = cities.filter(
      (c) => c.name.toLowerCase().includes(search) || c.slug.includes(search),
    );
  }

  cities.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(
    { success: true, count: cities.length, cities },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    },
  );
}
