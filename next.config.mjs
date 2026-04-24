/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // ─── Cloudinary ───────────────────────────────────────────
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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // ─── Amazon S3 (generic buckets) ──────────────────────────
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
      // ─── Amazon S3 (path-style URLs) ──────────────────────────
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**",
      },
      // ─── Amazon S3 (region-specific, e.g. s3.ap-south-1.amazonaws.com) ───
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      // ─── Amazon S3 (bucket in subdomain style, e.g. mybucket.s3.ap-south-1.amazonaws.com) ───
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      }
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Fix for recharts SSR issue: (0 , R.default) is not a function
  transpilePackages: ["recharts", "react-hot-toast", "jspdf", "html2canvas", "html-to-image"],
  webpack: (config, { isServer }) => {
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