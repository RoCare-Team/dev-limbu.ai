import { NextResponse } from "next/server";
import {
  CITY_PAGE_CATEGORIES,
  SEO_SITE_URL,
  resolveSeoCity,
} from "@/lib/cityPageSeo";

/**
 * GET /api/state-pages?city=Asansol[&category=local-seo]
 *
 * Backlinking feed: every city landing page limbu.ai serves for a city, with the
 * canonical URL and the page's own meta keywords. Same shape as rocareindia.com's
 * /api/state-pages so one backlink tool can read both.
 *
 * URLs come from the same builders the sitemap and the pages use, so every URL
 * here is live and canonical.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body, status = 200, extra = {}) =>
  NextResponse.json(body, { status, headers: { ...CORS, ...extra } });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET(req) {
  const { searchParams } = new URL(req.url);
  const cityParam = (searchParams.get("city") || "").trim();
  const categoryParam = (searchParams.get("category") || "").trim();

  if (!cityParam) {
    return json(
      {
        success: false,
        error: "city query param is required",
        example: `${SEO_SITE_URL}/api/state-pages?city=Asansol`,
      },
      400
    );
  }

  const city = resolveSeoCity(cityParam);
  if (!city) {
    return json({ success: false, scope: `city:${cityParam}`, error: "City not found" }, 404);
  }

  let categories = CITY_PAGE_CATEGORIES;
  if (categoryParam) {
    categories = CITY_PAGE_CATEGORIES.filter((c) => c.category === categoryParam);
    if (!categories.length) {
      return json(
        {
          success: false,
          error: `Unknown category "${categoryParam}"`,
          categories: CITY_PAGE_CATEGORIES.map((c) => c.category),
        },
        400
      );
    }
  }

  const result = categories.map((c) => ({
    category: c.category,
    count: 1,
    urls: [
      {
        url: `${SEO_SITE_URL}${c.path(city.slug)}`,
        meta_keywords: c.keywords(city.name).join(", "),
      },
    ],
  }));

  return json(
    {
      success: true,
      scope: `city:${city.name}`,
      category_count: result.length,
      url_count: result.reduce((n, c) => n + c.count, 0),
      categories: result,
    },
    200,
    // City list and keywords only change on deploy.
    { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
  );
}
