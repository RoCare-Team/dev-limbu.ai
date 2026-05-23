/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

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
    ];
  },

  images: {
    remotePatterns: [
      // S3
      {
        protocol: "https",
        hostname: "limbuai.s3.ap-south-1.amazonaws.com",
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
    ],
  },

  // Keep heavy native packages outside webpack bundle
  serverExternalPackages: [
    "pdfkit",
    "canvas",
    "sharp",
    "fontkit",
  ],

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