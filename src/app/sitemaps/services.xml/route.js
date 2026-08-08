import { getPublicSiteUrl } from "@/lib/siteUrl";
import { getCitySlugs } from "@/utils/citySlug";

export async function GET() {
  const base = getPublicSiteUrl();

  const urls = getCitySlugs().map((slug) => {
    return `
      <url>
        <loc>${base}/services/google-bussiness-profile-management-${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.85</priority>
      </url>

   
      <url>
        <loc>${base}/services/local-seo-${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.85</priority>
      </url>
    `;
  }).join("");

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