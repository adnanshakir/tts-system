import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "onnxruntime-web",
  ],
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": "onnxruntime-web",
    },
  },
};

export default nextConfig;