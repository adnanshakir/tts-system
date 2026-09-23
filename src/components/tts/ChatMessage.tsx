"use client";

import React, { useRef, useEffect } from "react";
import ShimmerBlock from "./ShimmerBlock";

export interface ChatMessageData {
  id: string;
  type: "user" | "assistant";
  text: string;
  audioUrl?: string;
  voiceName?: string;
  languageName?: string;
  timestamp: string;
  status: "sending" | "loading" | "streaming" | "done" | "error";
  chunkCount?: number;
  error?: string;
  voice?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onRetry?: (messageId: string) => void;
}

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play when audio becomes available (fallback for stitched blob)
  useEffect(() => {
    if (message.status === "done" && message.audioUrl && audioRef.current) {
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Autoplay policy fallback
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [message.status, message.audioUrl]);

  // ── User Bubble ──────────────────────────────────────────────
  if (message.type === "user") {
    return (
      <div className="flex justify-end animate-msg-in">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
          </div>
          <div className="flex justify-end mt-1 px-1">
            <span className="text-[10px] text-zinc-400">
              {message.timestamp}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Assistant Response ───────────────────────────────────────
  return (
    <div className="flex justify-start animate-msg-in">
      <div className="max-w-[85%] sm:max-w-[75%] w-full">
        <div className="space-y-2.5 py-1 px-1">
          {/* ── Loading State: spinner + shimmer text ─── */}
          {message.status === "loading" && <ShimmerBlock />}

          {/* ── Streaming State: real-time indicator ─── */}
          {message.status === "streaming" && (
            <div className="flex items-center gap-2 py-2.5 px-3 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-xl text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Receiving audio stream{" "}
                {typeof message.chunkCount === "number"
                  ? `(chunk ${message.chunkCount + 1})`
                  : "..."}
              </span>
            </div>
          )}

          {/* ── Error State ──── */}
          {message.status === "error" && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                <svg
                  className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-red-600">
                  {message.error || "Failed to generate audio."}
                </p>
              </div>
              {onRetry && (
                <button
                  onClick={() => onRetry(message.id)}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* ── Done State: Minimal audio player for stitched audio ─── */}
          {message.status === "done" && message.audioUrl && (
            <div className="space-y-2">
              {/* Audio player */}
              <audio
                ref={audioRef}
                controls
                src={message.audioUrl}
                className="w-full h-9 focus:outline-none"
              >
                Your browser does not support the audio element.
              </audio>

              {/* Minimal action row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-400">
                  {message.voiceName}
                </span>
                <a
                  href={message.audioUrl}
                  download={`kokoro-${message.voice || "audio"}-${message.id}.wav`}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp — show when finished or on error */}
        {(message.status === "done" || message.status === "error") && (
          <div className="flex justify-start mt-1 px-1">
            <span className="text-[10px] text-zinc-400">
              {message.timestamp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
