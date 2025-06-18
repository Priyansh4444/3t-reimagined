import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-markdown",
      "convex/react",
      "@clerk/nextjs",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },

  // Bundle optimization
  webpack: (config, { dev }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
            convex: {
              test: /[\\/]node_modules[\\/]convex[\\/]/,
              name: "convex",
              chunks: "all",
              priority: 20,
            },
            clerk: {
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              name: "clerk",
              chunks: "all",
              priority: 20,
            },
            ai: {
              test: /[\\/]node_modules[\\/](@ai-sdk|@openrouter|ai)[\\/]/,
              name: "ai",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for caching and security
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
            value: "origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [];
  },

  // Rewrites for API optimization
  async rewrites() {
    return [];
  },

  // Output configuration for deployment
  output: "standalone",

  // Enable SWC minification
  swcMinify: true,

  // Power optimization
  poweredByHeader: false,

  // Compression
  compress: true,

  // React strict mode for development
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
