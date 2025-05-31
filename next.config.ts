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

const withVercelToolbar = require('@vercel/toolbar/plugins/next')();
// Instead of module.exports = nextConfig, do this:
module.exports = withVercelToolbar(nextConfig);
