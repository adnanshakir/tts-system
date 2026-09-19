import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "kokoro-js",
    "onnxruntime-node",
    "@huggingface/transformers",
  ],
};

export default nextConfig;