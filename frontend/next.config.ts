import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scontent.fcrk1-2.fna.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;
