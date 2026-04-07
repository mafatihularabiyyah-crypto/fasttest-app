import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // MATIKAN INI
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;