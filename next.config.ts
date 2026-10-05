import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The dev server is opened at 127.0.0.1. Without this, Next blocks
  // hydration scripts and client fetches never leave the loading state.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
