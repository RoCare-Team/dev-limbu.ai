import { getPublicSiteUrl } from "@/lib/siteUrl";
import { SEO_TOOL_LIST, seoToolPath } from "@/lib/seoTools";

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/pricing",
  "/blog",
  "/privacy-policy",
  "/terms-and-conditions",
  "/cancellation-policy",
  "/work-with-us",
  "/webinar-demo",

  // Services (national pages; city pages live in services.xml)
  "/services/google-bussiness-profile-management",
  "/services/local-seo",
  "/google-business-management-service",
  "/city/gurugram",

  // Website SEO tool pages
  ...SEO_TOOL_LIST.map(seoToolPath),

  // Franchise
  "/bussiness/franchise-opportunities",
  "/franchise-opportunities",

  // Industry landing pages
  "/bakery-marketing-software",
  "/car-garage-marketing-software",
  "/clinic-marketing-software",
  "/education-marketing-software",
  "/gym-marketing-software",
  "/handyman-marketing-software",
  "/pest-control-marketing-software",
  "/realestate-marketing-software",
  "/restaurant-marketing-software",
  "/salon-marketing-software",
  "/tour-travel-marketing-software",
  "/yoga-wellness-marketing-software",

  // Guides
  "/how-to-connect-gmb",
  "/how-to-create-post",
  "/how-to-generate-magic-qr",
  "/how-to-post-on-gmb",
  "/how-to-reply-review",
];

export async function GET() {
  const base = getPublicSiteUrl();

  const urls = STATIC_PATHS.map((path) => `
    <url>
      <loc>${base}${path}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}