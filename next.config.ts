import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production-ready config */
  reactStrictMode: true,
  poweredByHeader: false,

  typescript: {
    // Fail on type errors in production builds
    ignoreBuildErrors: false,
  },

  eslint: {
    // Fail on lint errors in production builds
    ignoreDuringBuilds: false,
  },

  // Security headers (CSP, etc.)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  // Configure allowed origins for images if needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
