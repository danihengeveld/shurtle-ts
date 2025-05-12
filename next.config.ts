import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    version: packageJson.version,
  }
};

export default nextConfig;
