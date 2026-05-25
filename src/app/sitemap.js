import { getPublicSiteUrl } from "@/lib/siteUrl";

export default function sitemap() {
  const base = getPublicSiteUrl();

  return [
    {
      url: `${base}/sitemaps/static.xml`,
      lastModified: new Date(),
    },
    {
      url: `${base}/sitemaps/blogs.xml`,
      lastModified: new Date(),
    },
    {
      url: `${base}/sitemaps/services.xml`,
      lastModified: new Date(),
    },
    {
      url: `${base}/sitemaps/franchise.xml`,
      lastModified: new Date(),
    },
  ];
}