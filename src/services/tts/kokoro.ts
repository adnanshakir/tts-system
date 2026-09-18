import { KokoroTTS } from "kokoro-js";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

let ttsPromise: Promise<KokoroTTS> | null = null;

export async function getTTS(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    console.log("Initializing Kokoro TTS model...");
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