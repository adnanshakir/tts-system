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
const HINDI_G2P_URL =
  process.env.HINDI_G2P_URL || "http://127.0.0.1:8000/g2p";

let ttsPromise: Promise<KokoroTTS> | null = null;

export async function getTTS(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    console.log("Initializing Kokoro TTS model (cacheDir: /tmp/hf_home)...");

    ttsPromise = KokoroTTS.from_pretrained(MODEL, {
      dtype: "q8",
      device: "wasm",
    }).catch((error) => {
      console.error("Failed to load Kokoro model:", error);
      ttsPromise = null;
      throw error;
    });
  }

  return ttsPromise;
}

export async function getHindiPhonemes(text: string): Promise<string> {
  const response = await fetch(HINDI_G2P_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Hindi G2P service failed (${response.status}): ${errorText}`,
    );
  }

  const data: unknown = await response.json();

  const isObject = typeof data === "object" && data !== null;
  const errorMsg =
    isObject &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
      ? (data as { error: string }).error
      : undefined;
  const phonemes =
    isObject &&
    "phonemes" in data &&
    typeof (data as { phonemes?: unknown }).phonemes === "string"
      ? (data as { phonemes: string }).phonemes
      : undefined;

  if (!phonemes || phonemes.trim().length === 0) {
    throw new Error(errorMsg || "Hindi G2P returned no phonemes.");
  }

  return phonemes;
}

export async function generateHindi(text: string, voice: string) {
  const tts = await getTTS();

  const phonemes = await getHindiPhonemes(text);

  const { input_ids } = tts.tokenizer(phonemes, {
    truncation: true,
  });

  return tts.generate_from_ids(input_ids, {
    voice: voice as any,
  });
}
