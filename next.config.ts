import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use process.cwd() so this works on any OS and in CI — not just Windows.
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/category/home',
        destination: '/category/home-care',
        permanent: true,
      },
    ];
  },
  outputFileTracingRoot: process.cwd(),
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // These carousel files are compressed WebP assets and are requested
        // directly, so let browsers/CDNs reuse them instead of downloading or
        // re-encoding them on repeat visits.
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
