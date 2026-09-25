"use client";

import React from "react";
import TTSAudioPlayer from "./TTSAudioPlayer";

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
  streamingDuration?: number;
  error?: string;
  voice?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onRetry?: (messageId: string) => void;
}

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {

  // ── User Bubble ──────────────────────────────────────────────
  if (message.type === "user") {
    return (
      <div className="flex justify-end animate-msg-in">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-xs">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
          </div>
          <div className="flex justify-end mt-1 px-1">
            <span className="text-[10px] text-zinc-400 font-mono">
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
        <div className="py-1 px-1">
          <TTSAudioPlayer message={message} onRetry={onRetry} />
        </div>

        {/* Timestamp — show when finished or on error */}
        {(message.status === "done" || message.status === "error") && (
          <div className="flex justify-start mt-1 px-1">
            <span className="text-[10px] text-zinc-400 font-mono">
              {message.timestamp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

