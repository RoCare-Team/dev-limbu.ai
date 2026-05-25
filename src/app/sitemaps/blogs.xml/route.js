import { getPublicSiteUrl } from "@/lib/siteUrl";
import dbConnect from "@/lib/dbConnect";
import Blog from "@/models/Blog";

export async function GET() {
  await dbConnect();

  const base = getPublicSiteUrl();

  const blogs = await Blog.find({
    status: "published",
  }).select("slug");

  const urls = blogs.map((blog) => `
    <url>
      <loc>${base}/blog/${blog.slug}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
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