import { NextResponse } from "next/server";

export async function GET() {
  const raw = (process.env.HINDI_G2P_URL || "").trim().replace(/\/+$/, "");
  const base = raw.endsWith("/g2p") ? raw.slice(0, -4) : raw;

  if (!base) {
    return NextResponse.json(
      { status: "error", error: "HINDI_G2P_URL env var is not set" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    return NextResponse.json({
      status: res.ok ? "ok" : "error",
      g2pUrl: base,
      g2pStatus: res.status,
      g2pBody: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", g2pUrl: base, error: String(err) },
      { status: 500 },
    );
  }
}