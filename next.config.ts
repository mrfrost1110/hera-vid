import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/analyze",
        destination: "http://localhost:8000/api/analyze",
      },
    ];
  },
};

export default nextConfig;
