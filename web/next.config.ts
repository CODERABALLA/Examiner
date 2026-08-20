import type { NextConfig } from "next";

const API_BACKEND =
  process.env.API_BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
