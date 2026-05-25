import { getPublicSiteUrl } from "@/lib/siteUrl";

const STATIC_PATHS = [
  "/",
  "/contact",
  "/pricing",
  "/privacy-policy",
  "/terms-and-conditions",
  "/services/google-bussiness-profile-management",
  "/bussiness/franchise-opportunities",
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