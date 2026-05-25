import { getPublicSiteUrl } from "@/lib/siteUrl";
import { POPULAR_CITIES } from "@/utils/popularCity";

function toKebabSegment(city) {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const base = getPublicSiteUrl();

  const urls = POPULAR_CITIES.map((city) => {
    const slug = toKebabSegment(city);

    return `
      <url>
        <loc>${base}/bussiness/franchise-opportunities-${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
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