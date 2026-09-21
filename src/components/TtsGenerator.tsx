"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { KOKORO_VOICES, SUPPORTED_LANGUAGES, type Language } from "@/types/tts";
import WelcomeHeader from "./tts/WelcomeHeader";
import ChatFeed from "./tts/ChatFeed";
import ChatInput from "./tts/ChatInput";
import type { ChatMessageData } from "./tts/ChatMessage";

let messageIdCounter = 0;
function nextId() {
  messageIdCounter += 1;
  return `msg-${Date.now()}-${messageIdCounter}`;
}

export default function TtsGenerator() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const audioUrlsRef = useRef<string[]>([]);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const generateAudio = useCallback(
    async (
      text: string,
      language: Language,
      voice: string,
      assistantMsgId: string,
    ) => {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language, voice }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error (${response.status})`);
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        audioUrlsRef.current.push(audioUrl);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, status: "done" as const, audioUrl }
              : m,
          ),
        );
      } catch (err: unknown) {
        console.error("TTS generation error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred while generating speech.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  status: "error" as const,
                  error: errorMessage,
                }
              : m,
          ),
        );
      }
    },
    [],
  );

  const handleRetry = useCallback(
    (messageId: string) => {
      const assistantIdx = messages.findIndex((m) => m.id === messageId);
      if (assistantIdx === -1) return;

      const assistantMsg = messages[assistantIdx];
      let userMsg: ChatMessageData | null = null;
      for (let i = assistantIdx - 1; i >= 0; i--) {
        if (messages[i].type === "user") {
          userMsg = messages[i];
          break;
        }
      }
      if (!userMsg) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, status: "loading" as const, error: undefined }
            : m,
        ),
      );

      const language =
        (assistantMsg.languageName
          ? (SUPPORTED_LANGUAGES.find((l) => l.name === assistantMsg.languageName)
              ?.id as Language)
          : "en") || "en";

      generateAudio(
        userMsg.text,
        language,
        assistantMsg.voice || "af_bella",
        messageId,
      );
    },
    [generateAudio, messages],
  );

  const handleSend = useCallback(
    (
      text: string,
      settings: { language: Language; voice: string; model: string },
    ) => {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const voiceObj = KOKORO_VOICES.find((v) => v.id === settings.voice);
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === settings.language);

      const userMsgId = nextId();
      const assistantMsgId = nextId();

      const userMsg: ChatMessageData = {
        id: userMsgId,
        type: "user",
        text,
        timestamp,
        status: "done",
      };

      const assistantMsg: ChatMessageData = {
        id: assistantMsgId,
        type: "assistant",
        text,
        voiceName: voiceObj?.name || settings.voice,
        languageName: langObj?.name || settings.language,
        voice: settings.voice,
        timestamp,
        status: "loading",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // Fire the API call
      generateAudio(text, settings.language, settings.voice, assistantMsgId);
    },
    [generateAudio],
  );

  const hasMessages = messages.length > 0;

  // ── Empty state: heading + centered input ──
  if (!hasMessages) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-44px)] items-center justify-center">
        <WelcomeHeader />
        <div className="w-full mt-4">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    );
  }

  // ── Chat state: feed fills space, input pinned at bottom ──
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-44px)]">
      {/* Chat feed takes all available space */}
      <div className="flex-1 overflow-hidden flex flex-col pt-2 min-h-0">
        <ChatFeed messages={messages} onRetry={handleRetry} />
      </div>

      {/* Input bar pinned at bottom */}
      <div className="shrink-0 pt-2 pb-1">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
