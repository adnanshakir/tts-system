import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "kokoro-js",
    "@huggingface/transformers",
  ],
};

export default nextConfig;