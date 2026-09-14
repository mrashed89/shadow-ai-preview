import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Cloud / browser agents often open http://127.0.0.1:<port> while Next
  // reports localhost — without this, client bundles/HMR are blocked and
  // React never hydrates (forms fall back to native GET).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
