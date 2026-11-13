/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // gzip/brotli on HTML + RSC payloads (nginx isse aage bas pass karta hai)
  compress: true,

  poweredByHeader: false,

  // Prevent build failures (Next 16 no longer lints during build)
  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      {
        // "Local Rank Tracker" ka naam "Competitor Analysis" ho gaya. Purane
        // bookmarks / shared links na tooten isliye permanent redirect.
        source: "/local-rank-tracker",
        destination: "/competitor-analysis",
        permanent: true,
      },
      {
        source: "/local-rank-tracker/:path*",
        destination: "/competitor-analysis/:path*",
        permanent: true,
      },
    ];
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
        // `_next/static/*` ko chhodna zaroori hai. Wo already content-hashed hai
        // aur Next usse `immutable, max-age=1 saal` bhejta hai; ye rule usse
        // 30 din par downgrade kar deta tha — Lighthouse fonts (woff2) ko isi
        // wajah se "inefficient cache lifetime" me dikhata tha.
        source: "/:path((?!_next/).*)\\.(svg|ico|png|jpg|jpeg|webp|avif|gif|woff|woff2)",
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

    // Har <Image> apne srcSet me in sab widths ki poori `/_next/image?url=...`
    // URL likhta hai. Default 16 widths the (16…3840), to homepage par ~64
    // images × ~15 entries = 216 KiB srcSet — poore HTML ka 35%.
    //
    // Site ki sabse badi image hero hai (~640 CSS px), to 1920 se aage kuch
    // chahiye hi nahi; chhote 16/48/96 bhi koi layout use nahi karta.
    // 16 widths → 10 widths.
    deviceSizes: [640, 750, 828, 1080, 1920],
    imageSizes: [32, 64, 128, 256, 384],
    // Business-type tiles use quality 70; without it Next warns in dev ("1 Issue").
    qualities: [70, 75],

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
