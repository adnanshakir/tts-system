"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { IconMicrophone } from "@tabler/icons-react";
import type { ChatMessageData } from "./ChatMessage";
import ShimmerBlock from "./ShimmerBlock";

interface TTSAudioPlayerProps {
  message: ChatMessageData;
  onRetry?: (messageId: string) => void;
}

/**
 * Formats time in seconds to mm:ss format.
 */
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function TTSAudioPlayer({ message, onRetry }: TTSAudioPlayerProps) {
  const { status, audioUrl, chunkCount, streamingDuration, error, voiceName, voice, id } = message;

  // ── STREAMING TIMER STATE ────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status !== "streaming") {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // ── WAVESURFER INTEGRATION FOR COMPLETED AUDIO ──────────────
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: status === "done" && audioUrl ? audioUrl : undefined,
    height: 40,
    waveColor: "#d4d4d8", // zinc-300 (inactive neutral waveform)
    progressColor: "#18181b", // zinc-900 (played accent portion)
    barWidth: 3,
    barGap: 3,
    barRadius: 3,
    cursorWidth: 0,
    cursorColor: "transparent",
    normalize: true,
    interact: true,
    dragToSeek: true,
    autoplay: false,
  });

  // Track real-time seeking/dragging updates so progress & time move smoothly with mouse
  const [dragCurrentTime, setDragCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    if (!wavesurfer) return;

    const updateSeekPosition = () => {
      setDragCurrentTime(wavesurfer.getCurrentTime());
    };

    const unsubSeeking = wavesurfer.on("seeking", updateSeekPosition);
    const unsubInteraction = wavesurfer.on("interaction", updateSeekPosition);
    const unsubDrag = wavesurfer.on("drag", updateSeekPosition);
    const unsubTimeUpdate = wavesurfer.on("timeupdate", () => {
      setDragCurrentTime(null);
    });

    return () => {
      unsubSeeking();
      unsubInteraction();
      unsubDrag();
      unsubTimeUpdate();
    };
  }, [wavesurfer]);


  const duration = wavesurfer ? wavesurfer.getDuration() : 0;

  const togglePlayPause = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  }, [wavesurfer]);

  // ── SHARE / DOWNLOAD HANDLER ──────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!audioUrl) return;
    const fileName = `kokoro-${voice || "audio"}-${id || "speech"}.wav`;

    const triggerDownload = () => {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "audio/wav" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Generated Audio",
          text: `TTS Audio (${voiceName || "Kokoro"})`,
          files: [file],
        });
      } else {
        triggerDownload();
      }
    } catch {
      triggerDownload();
    }
  }, [audioUrl, voice, voiceName, id]);

  // ── 1. GENERATING STATE ──────────────────────────────────────
  if (status === "loading" || status === "sending") {
    return <ShimmerBlock />;
  }


  // ── 2. STREAMING STATE ───────────────────────────────────────
  if (status === "streaming") {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 bg-zinc-50 border border-zinc-200/90 rounded-2xl shadow-2xs transition-all duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Subtle live soundwave animation bars */}
          <div className="flex items-center gap-0.5 h-4 px-1 shrink-0">
            <span className="w-0.5 bg-zinc-800 rounded-full animate-soundwave-1" />
            <span className="w-0.5 bg-zinc-800 rounded-full animate-soundwave-2" />
            <span className="w-0.5 bg-zinc-800 rounded-full animate-soundwave-3" />
            <span className="w-0.5 bg-zinc-800 rounded-full animate-soundwave-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-zinc-800 truncate select-none">
              Streaming audio&hellip;
            </span>

            {typeof chunkCount === "number" && (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md shrink-0">
                chunk {chunkCount + 1}
              </span>
            )}
          </div>
        </div>

        {/* Expected length of the full audio */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono font-medium text-zinc-500 select-none">
            {typeof streamingDuration === "number" && streamingDuration > 0
              ? formatTime(streamingDuration)
              : formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>
    );
  }

  // ── 3. ERROR STATE ───────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50/90 border border-red-200 text-xs font-medium text-red-700">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
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
            <span className="truncate">{error || "Couldn't generate audio."}</span>
          </div>

          {onRetry && id && (
            <button
              onClick={() => onRetry(id)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-md transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-red-600"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 4. COMPLETE AUDIO STATE ──────────────────────────────────
  if (status === "done" && audioUrl) {
    return (
      <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 transition-all duration-200">
        {/* Top Player Row: Play/Pause + Waveform + Time */}
        <div className="flex items-center gap-3">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors shrink-0 shadow-xs focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Waveform Container */}
          <div className="flex-1 min-w-0 relative flex items-center h-10">
            {/* Skeleton loader shown while Wavesurfer decodes */}
            {!isReady && (
              <div className="absolute inset-0 flex items-center gap-1 animate-pulse">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-zinc-200 rounded-full"
                    style={{ height: `${20 + (i % 5) * 15}%` }}
                  />
                ))}
              </div>
            )}

            {/* Wavesurfer container */}
            <div
              ref={containerRef}
              className={`w-full transition-opacity duration-200 ${
                isReady ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Time Display */}
          <div className="text-[11px] font-mono font-medium text-zinc-500 shrink-0 select-none">
            {formatTime(dragCurrentTime !== null ? dragCurrentTime : currentTime)} / {formatTime(duration)}
          </div>
        </div>


        {/* Bottom Actions Row: Voice metadata & Share/Download controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 text-xs">
          <span className="text-[11px] font-medium text-zinc-400 select-none flex items-center gap-1">
            <IconMicrophone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {voiceName || "Kokoro"}
          </span>

          <div className="flex items-center gap-3">
            {/* Share Button */}
            <button
              onClick={handleShare}
              aria-label="Share audio"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>

            {/* Download Button */}
            <a
              href={audioUrl}
              download={`kokoro-${voice || "audio"}-${id || "speech"}.wav`}
              aria-label="Download audio file"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900"
            >
              <svg
                className="w-3.5 h-3.5"
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
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
