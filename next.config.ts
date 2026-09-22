import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["kokoro-js", "@huggingface/transformers", "onnxruntime-node"],
  outputFileTracingIncludes: {
    "/api/tts": [
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
      "./node_modules/kokoro-js/voices/**/*",
    ],
  },
};

export default nextConfig;