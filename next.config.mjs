/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // gzip/brotli on HTML + RSC payloads (nginx isse aage bas pass karta hai)
  compress: true,

  poweredByHeader: false,

  // Prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // `public/` se serve hone wale assets par Next default `max-age=0` bhejta
        // hai, isliye har visit par sab dobara download hota tha.
        //
        // Ye files content-hashed nahi hain, isliye immutable nahi kar sakte —
        // par 1 din bahut chhota tha (Lighthouse "inefficient cache lifetime"
        // yahi flag karta hai). 30 din + lamba stale-while-revalidate matlab
        // repeat visitor cache se serve hota hai aur naya version background me
        // aa jata hai.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/:path*.(svg|ico|png|jpg|jpeg|webp|avif|gif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],

    // Optimizer ka apna cache — upstream (S3) koi Cache-Control nahi bhejta,
    // to bina iske har baar re-fetch + re-encode hota hai.
    minimumCacheTTL: 2678400, // 31 din

    remotePatterns: [
      // S3
      {
        protocol: "https",
        hostname: "limbuai.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // Cloudinary HTTP
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "limbuai.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.ap-south-1.amazonaws.com",
        pathname: "/limbuai/**",
      },

      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // Unsplash
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },

      // Placeholder
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },

      // LinkedIn
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media-exp1.licdn.com",
        pathname: "/**",
      },

      // Generic S3
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },

  // Keep heavy native packages outside webpack bundle
  serverExternalPackages: ["pdfkit", "canvas", "sharp", "fontkit"],

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },

    // MEMORY OPTIMIZATION
    cpus: 1,
    staticGenerationMaxConcurrency: 1,

    // disable for low RAM build servers
    webpackBuildWorker: false,
    webpackMemoryOptimizations: false,

    optimizePackageImports: [
      "lucide-react",
      "@mui/material",
      "@mui/icons-material",
      "@heroicons/react",
      "react-icons",
    ],
  },

  transpilePackages: [
    "recharts",
    "react-hot-toast",
    "jspdf",
    "html2canvas",
    "html-to-image",
  ],

  webpack: (config, { isServer }) => {
    // reduce memory usage
    config.cache = false;

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
