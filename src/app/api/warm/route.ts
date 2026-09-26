import { NextResponse } from "next/server";
import { getTTS } from "@/services/tts/kokoro";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    await getTTS();
    return NextResponse.json({ status: "ready", tookMs: Date.now() - t0 });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: String(err?.message || err) },
      { status: 500 },
    );
  }
}
