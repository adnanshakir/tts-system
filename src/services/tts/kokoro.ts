import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";

// Configure Hugging Face / transformers cache to /tmp for Vercel read-only filesystem
if (typeof process !== "undefined" && process.env) {
  process.env.HF_HOME = "/tmp/hf_home";
  process.env.TRANSFORMERS_CACHE = "/tmp/hf_home";
}

if (env) {
  env.cacheDir = "/tmp/hf_home";
  env.allowLocalModels = false;
}

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

let ttsPromise: Promise<KokoroTTS> | null = null;

export async function getTTS(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    console.log("Initializing Kokoro TTS model (cacheDir: /tmp/hf_home)...");
    ttsPromise = KokoroTTS.from_pretrained(MODEL, {
      dtype: "q8",
      device: "cpu",
    }).catch((error) => {
      console.error("Failed to load Kokoro model:", error);
      ttsPromise = null; // Reset cache so subsequent calls can retry
      throw error;
    });
  }

  return ttsPromise;
}