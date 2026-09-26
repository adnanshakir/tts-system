import { NextRequest, NextResponse } from "next/server";
import { getTTS } from "@/services/tts/kokoro";

export const dynamic = "force-dynamic";

// Concurrency & rate limiting control
let activeWarmRequests = 0;
const MAX_CONCURRENT_WARM_REQUESTS = 1;

const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 1000;
const requestTimestamps: number[] = [];

export async function GET(request: NextRequest) {
  const now = Date.now();

  // Clean up old timestamps outside window
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - WINDOW_MS) {
    requestTimestamps.shift();
  }

  // Enforce rate limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { status: "rate_limited", error: "Too many warm-up requests. Please try again later." },
      { status: 429 },
    );
  }

  // Enforce concurrency limit: reject without starting initialization if already in progress
  if (activeWarmRequests >= MAX_CONCURRENT_WARM_REQUESTS) {
    return NextResponse.json(
      { status: "busy", error: "A warm-up initialization request is already in progress." },
      { status: 429 },
    );
  }

  requestTimestamps.push(now);
  activeWarmRequests++;

  const t0 = Date.now();
  try {
    await getTTS();
    return NextResponse.json({ status: "ready", tookMs: Date.now() - t0 });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: String(err?.message || err) },
      { status: 500 },
    );
  } finally {
    activeWarmRequests = Math.max(0, activeWarmRequests - 1);
  }
}
