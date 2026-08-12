/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production domain configuration
  async redirects() {
    return [
      {
        source: "/experience/:slug/ar",
        destination: "/experience/:slug",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "thescanstory.com",
          },
        ],
        destination: "https://www.thescanstory.com/:path*",
        permanent: true,
      },
    ];
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://www.thescanstory.com" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  
  // Compression
  compress: true,
  
  // ffmpeg-static/ffprobe-static ship native binaries, not JS — keep
  // webpack from trying to bundle/parse them, and explicitly trace them
  // into the two routes that shell out to ffmpeg (Vercel's file tracer
  // doesn't follow child_process binary paths on its own).
  experimental: {
    serverComponentsExternalPackages: ["ffmpeg-static", "ffprobe-static"],
    outputFileTracingIncludes: {
      "/api/upload/complete": [
        "./node_modules/ffmpeg-static/**",
        "./node_modules/ffprobe-static/**",
      ],
      "/api/admin/orders/[id]/attach-media": [
        "./node_modules/ffmpeg-static/**",
        "./node_modules/ffprobe-static/**",
      ],
    },
  },
};

export default nextConfig;
