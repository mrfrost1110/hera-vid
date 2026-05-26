import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/analyze",
        destination: "http://localhost:8000/api/analyze",
      },
      {
        source: "/api/faces",
        destination: "http://localhost:8000/api/faces",
      },
      {
        source: "/api/faces/:path*",
        destination: "http://localhost:8000/api/faces/:path*",
      },
    ];
  },
};

export default nextConfig;
