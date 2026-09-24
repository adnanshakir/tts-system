import { KokoroTTS } from "kokoro-js";
import { env } from "@huggingface/transformers";

// ── HuggingFace cache configuration ────────────────────────────────
// Vercel Lambda filesystem is read-only except /tmp.
// env.cacheDir is the authoritative setting for @huggingface/transformers;
// the process-level env vars are kept as a safety net for older code paths.
const HF_CACHE = process.env.VERCEL ? "/tmp/.hf-cache" : undefined;

if (HF_CACHE) {
  process.env.HF_HOME = HF_CACHE;
  process.env.TRANSFORMERS_CACHE = HF_CACHE;
  env.cacheDir = HF_CACHE;
}

env.allowLocalModels = false;

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const HINDI_G2P_URL = process.env.HINDI_G2P_URL || "http://127.0.0.1:8000/g2p";

let ttsPromise: Promise<KokoroTTS> | null = null;

export async function getTTS(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    console.log(
      `Initializing Kokoro TTS model (device: cpu, cache: ${HF_CACHE ?? "default"})...`,
    );

    ttsPromise = KokoroTTS.from_pretrained(MODEL, {
      dtype: "q8",
      device: "cpu",
    }).catch((error) => {
      console.error("Failed to load Kokoro model:", error);
      ttsPromise = null;
      throw error;
    });
  }

  return ttsPromise;
}

/**
 * Creates a timeout signal compatible across Node 18, Node 20+, and browsers.
 */
function createTimeoutSignal(
  timeoutMs: number,
  outerSignal?: AbortSignal,
): AbortSignal {
  if (typeof (AbortSignal as any).any === "function" && outerSignal) {
    return (AbortSignal as any).any([
      outerSignal,
      AbortSignal.timeout(timeoutMs),
    ]);
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("TimeoutError")),
    timeoutMs,
  );

  if (outerSignal) {
    if (outerSignal.aborted) {
      controller.abort(outerSignal.reason);
      clearTimeout(timer);
    } else {
      outerSignal.addEventListener(
        "abort",
        () => {
          controller.abort(outerSignal.reason);
          clearTimeout(timer);
        },
        { once: true },
      );
    }
  }

  return controller.signal;
}

/**
 * Splits text into sentence-aware chunks capped around maxChars (default 350).
 * Handles standard punctuation (.!?) and Devanagari danda (।).
 */
export function splitIntoChunks(
  text: string,
  maxChars = 350,
  firstChunkMaxChars = 150,
): string[] {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const limit = chunks.length === 0 ? firstChunkMaxChars : maxChars;

    if ((current + " " + trimmed).length > limit && current) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? `${current} ${trimmed}` : trimmed;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/**
 * Fetches Hindi phonemes with scoped retry logic (retries only on 5xx or network/timeout errors).
 */
export async function getHindiPhonemes(
  text: string,
  signal?: AbortSignal,
): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    if (signal?.aborted) {
      throw new Error("Generation aborted by client.");
    }

    try {
      const fetchSignal = createTimeoutSignal(15000, signal);

      const response = await fetch(HINDI_G2P_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ text }),
        signal: fetchSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const is5xx = response.status >= 500 && response.status < 600;

        if (is5xx && attempt < maxRetries && !signal?.aborted) {
          console.warn(
            `Hindi G2P service 5xx error (${response.status}), retrying attempt ${attempt}/${maxRetries}...`,
          );
          await new Promise((res) => setTimeout(res, 1000 * attempt));
          continue;
        }

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
    } catch (err: any) {
      if (signal?.aborted) {
        throw new Error("Generation aborted by client.");
      }

      const isRetryable =
        err.name === "TimeoutError" ||
        err.name === "TypeError" ||
        err.message?.includes("fetch failed") ||
        err.message?.includes("network");

      if (isRetryable && attempt < maxRetries) {
        console.warn(
          `Hindi G2P network/timeout error (${err.message}), retrying attempt ${attempt}/${maxRetries}...`,
        );
        await new Promise((res) => setTimeout(res, 1000 * attempt));
        continue;
      }

      throw err;
    }
  }

  throw new Error("Hindi G2P service unreachable after retries.");
}

/**
 * Safely resolves phonemes under the 510 character ceiling.
 * If phoneme string exceeds 510, splits text into sub-chunks.
 */
async function getPhonemesSafely(
  chunkText: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const phonemes = await getHindiPhonemes(chunkText, signal);
  if (phonemes.length <= 510) {
    return [phonemes];
  }

  const words = chunkText.split(/\s+/);
  if (words.length <= 1) {
    throw new Error(
      `Phoneme string length (${phonemes.length}) exceeds Kokoro limit of 510 phonemes even for a single word/phrase.`,
    );
  }

  const mid = Math.floor(words.length / 2);
  const leftText = words.slice(0, mid).join(" ");
  const rightText = words.slice(mid).join(" ");

  const leftPhonemes = await getPhonemesSafely(leftText, signal);
  const rightPhonemes = await getPhonemesSafely(rightText, signal);
  return [...leftPhonemes, ...rightPhonemes];
}

export async function* streamEnglish(
  text: string,
  voice: string,
  signal?: AbortSignal,
) {
  const tts = await getTTS();
  const chunks = splitIntoChunks(text);

  for (const chunk of chunks) {
    if (signal?.aborted) break;
    const audio = await tts.generate(chunk, { voice: voice as any });
    yield audio;
  }
}

export async function* streamHindi(
  text: string,
  voice: string,
  signal?: AbortSignal,
) {
  const tts = await getTTS();
  const chunks = splitIntoChunks(text);

  for (const chunk of chunks) {
    if (signal?.aborted) break;
    const phonemeList = await getPhonemesSafely(chunk, signal);
    for (const phonemes of phonemeList) {
      if (signal?.aborted) break;
      const { input_ids } = tts.tokenizer(phonemes, { truncation: false });
      const audio = await tts.generate_from_ids(input_ids, { voice: voice as any });
      yield audio;
    }
  }
}
