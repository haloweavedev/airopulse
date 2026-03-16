import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdf-parse', '@tavily/core'],
};

export default nextConfig;
