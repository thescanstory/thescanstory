/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/experience/:slug/ar",
        destination: "/experience/:slug",
        permanent: true,
      },
    ];
  },
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
