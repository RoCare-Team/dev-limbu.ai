import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.limbu.ai"),

  title: "Local SEO Services & Google Maps Ranking | Limbu.ai",

  description:
    "Improve local search rankings with Limbu.ai’s Local SEO services. Optimize your Google Business Profile, manage reviews, and rank higher on Google Maps.",

  keywords: [
    "local SEO services",
    "Google Maps ranking",
    "Google Business Profile optimization",
    "GMB management",
    "local business SEO",
    "Google My Business optimization",
    "review management software",
    "AI SEO automation",
    "local search optimization",
    "Google Maps SEO",
    "business profile management",
    "local marketing services",
    "limbu.ai",
  ],

  authors: [
    {
      name: "Limbu AI",
      url: "https://www.limbu.ai",
    },
  ],

  creator: "Limbu AI",

  publisher: "Limbu AI",

  alternates: {
    canonical: "https://www.limbu.ai/services/local-seo",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "Local SEO Services & Google Maps Ranking | Limbu.ai",

    description:
      "Improve local search rankings with Limbu.ai’s Local SEO services and Google Business Profile optimization tools.",

    url: "https://www.limbu.ai/services/local-seo",

    siteName: "Limbu AI",

    locale: "en_US",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Local SEO Services & Google Maps Ranking | Limbu.ai",

    description:
      "Boost Google Maps rankings, optimize your Google Business Profile, and grow local visibility with Limbu.ai.",
  },

  category: "Local SEO",
};

const Layout = ({ children }) => {
  return <>{children}</>;
};

export default Layout;