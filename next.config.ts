import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    version: packageJson.version,
  },
  experimental: {
    ppr: "incremental"
  }
};

export default nextConfig;
