import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    agentFeedback: true,
    turbopackPluginRuntimeStrategy: "forceWorkerThreads",
  },
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: '/dashboard/residents/:path*',
        destination: '/residents/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/rooms/:path*',
        destination: '/rooms/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/payments/:path*',
        destination: '/payments/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/complaints/:path*',
        destination: '/complaints/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/visitors/:path*',
        destination: '/visitors/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/notices/:path*',
        destination: '/notices/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/food-menu/:path*',
        destination: '/food-menu/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/profile/:path*',
        destination: '/profile/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/settings/:path*',
        destination: '/settings/:path*',
        permanent: true,
      },
      {
        source: '/settings/profile',
        destination: '/profile',
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
