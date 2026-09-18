import { NextRequest, NextResponse } from "next/server";
import { getTTS } from "@/services/tts/kokoro";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { text, voice = "af_bella" } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text prompt is required." },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Text exceeds maximum limit of 2000 characters for a single request." },
        { status: 400 }
      );
    }

    const tts = await getTTS();

    console.log(`Generating audio for text (${text.length} chars) with voice '${voice}'...`);
    const audio = await tts.generate(text.trim(), {
      voice,
    });

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
      { error: errorMessage },
      { status: 500 }
    );
  }
}