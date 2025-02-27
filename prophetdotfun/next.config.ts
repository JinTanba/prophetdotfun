import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ビルド時にESLintのチェックを無視する
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
