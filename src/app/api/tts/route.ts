import { NextRequest, NextResponse } from "next/server";
import { getTTS, generateHindi } from "@/services/tts/kokoro";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ENGLISH_VOICES = [
  "af_heart",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
] as const;

const HINDI_VOICES = ["hf_alpha", "hf_beta", "hm_omega", "hm_psi"] as const;

type Language = "en" | "hi";

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "hi";
}

function isEnglishVoice(value: unknown): boolean {
  return (
    typeof value === "string" &&
    ENGLISH_VOICES.includes(value as (typeof ENGLISH_VOICES)[number])
  );
}

function isHindiVoice(value: unknown): boolean {
  return (
    typeof value === "string" &&
    HINDI_VOICES.includes(value as (typeof HINDI_VOICES)[number])
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      text,
      language = "en",
      voice = language === "hi" ? "hm_omega" : "af_bella",
    } = body;

    // -------------------------
    // Text validation
    // -------------------------

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text prompt is required." },
        { status: 400 },
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        {
          error:
            "Text exceeds maximum limit of 2000 characters for a single request.",
        },
        { status: 400 },
      );
    }

    // -------------------------
    // Language validation
    // -------------------------

    if (!isLanguage(language)) {
      return NextResponse.json(
        {
          error: "Invalid language. Supported languages: en, hi.",
        },
        { status: 400 },
      );
    }

    // -------------------------
    // Voice validation
    // -------------------------

    if (language === "en" && !isEnglishVoice(voice)) {
      return NextResponse.json(
        {
          error: `Invalid English voice: ${voice}`,
        },
        { status: 400 },
      );
    }

    if (language === "hi" && !isHindiVoice(voice)) {
      return NextResponse.json(
        {
          error: `Invalid Hindi voice: ${voice}`,
        },
        { status: 400 },
      );
    }

    console.log(
      `Generating ${language} audio for ${text.length} characters with voice '${voice}'...`,
    );

    // -------------------------
    // Generate audio
    // -------------------------

    const audio =
      language === "hi"
        ? await generateHindi(text.trim(), voice)
        : await getTTS().then((tts) =>
            tts.generate(text.trim(), {
              voice: voice as (typeof ENGLISH_VOICES)[number],
            }),
          );

    // -------------------------
    // Convert to WAV
    // -------------------------

    const wavArrayBuffer = await audio.toWav();
    const wavBuffer = Buffer.from(wavArrayBuffer);

    return new NextResponse(wavBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'inline; filename="speech.wav"',
        "Content-Length": wavBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("TTS generation API error:", error);

    const errorMessage = error?.message || "Failed to generate audio stream.";

    return NextResponse.json(
      {
        error: errorMessage,
        details: String(error),
      },
      { status: 500 },
    );
  }
}
