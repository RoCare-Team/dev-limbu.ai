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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Fix for recharts SSR issue: (0 , R.default) is not a function
  // This ensures recharts is properly transpiled for client-side rendering
  transpilePackages: ['recharts', 'react-hot-toast', 'jspdf', 'html2canvas'],
  // Ensure proper webpack configuration for these packages
  webpack: (config, { isServer }) => {
    // Fix for jspdf and html2canvas SSR issues
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
