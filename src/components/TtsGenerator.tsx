"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KOKORO_VOICES, SUPPORTED_LANGUAGES, type Language } from "@/types/tts";
import { IconLanguage, IconMicrophone } from "@tabler/icons-react";

const MODEL_OPTIONS: Record<string, string> = {
  kokoro: "Kokoro 82M",
  elevenlabs: "ElevenLabs (Coming Soon)",
  xtts: "XTTS v2 (Coming Soon)",
  chattts: "ChatTTS (Coming Soon)",
  f5tts: "F5-TTS (Coming Soon)",
};

export default function TtsGenerator() {
  const [text, setText] = useState<string>(
    "Hello! I am your AI voice agent powered by Kokoro. How can I assist you today?",
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const [selectedVoice, setSelectedVoice] = useState<string>("af_bella");
  const [selectedModel, setSelectedModel] = useState<string>("kokoro");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastGeneratedInfo, setLastGeneratedInfo] = useState<{
    text: string;
    voiceName: string;
    languageName: string;
    timestamp: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Filter voices by selected language
  const filteredVoices = KOKORO_VOICES.filter(
    (voice) => voice.language === selectedLanguage,
  );

  // Handle language switch
  const handleLanguageChange = (langId: string) => {
    const lang = langId as Language;
    setSelectedLanguage(lang);
    const available = KOKORO_VOICES.filter((v) => v.language === lang);
    if (available.length > 0) {
      setSelectedVoice(available[0].id);
    }
  };

  // Auto-resize textarea logic up to max limit (200px)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, 200);
      el.style.height = `${newHeight}px`;
    }
  }, [text]);

  // Revoke Object URL on cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter a prompt for your voice agent.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          language: selectedLanguage,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const blob = await response.blob();

      // Clean up previous blob URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const newUrl = URL.createObjectURL(blob);
      setAudioUrl(newUrl);

      const voiceObj = KOKORO_VOICES.find((v) => v.id === selectedVoice);
      const langObj = SUPPORTED_LANGUAGES.find(
        (l) => l.id === selectedLanguage,
      );

      setLastGeneratedInfo({
        text: text.trim(),
        voiceName: voiceObj ? voiceObj.name : selectedVoice,
        languageName: langObj ? langObj.name : selectedLanguage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // Auto-play generated audio once loaded
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // Autoplay policy restriction fallback
          });
        }
      }, 150);
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setError(err.message || "An error occurred while generating speech.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(
    (l) => l.id === selectedLanguage,
  );
  const currentVoiceObj = KOKORO_VOICES.find((v) => v.id === selectedVoice);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-16">
      {/* Impactful Headline */}
      <div className="text-center space-y-2 mb-8 select-none">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 shadow-zinc-700">
          What should your voice agent say?
        </h1>
      </div>

      {/* AUDIO OUTPUT DISPLAYED ON TOP OF THE TEXTAREA WHEN GENERATED */}
      {audioUrl && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-250">
          {/* Audio Output Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-zinc-800 uppercase tracking-wide">
                Generated Audio
              </span>
              <Badge
                variant="secondary"
                className="text-[11px] bg-zinc-100 text-zinc-700"
              >
                {lastGeneratedInfo?.voiceName}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                {lastGeneratedInfo?.timestamp}
              </span>
              <button
                onClick={() => {
                  if (audioUrl) URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-colors"
                title="Close Audio"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* HTML5 Audio Controls */}
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <audio
              ref={audioRef}
              controls
              src={audioUrl}
              className="w-full h-10 focus:outline-none"
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Transcription & Download Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-zinc-600 italic bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-lg flex-1 truncate">
              "{lastGeneratedInfo?.text}"
            </div>

            <a
              href={audioUrl}
              download={`kokoro-${selectedVoice}-${Date.now()}.wav`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-lg transition-colors shrink-0"
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
              Download WAV
            </a>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
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
          <div className="flex-1">
            <p className="font-semibold text-xs uppercase tracking-wider">
              Generation Error
            </p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 p-0.5 rounded"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* CHATBOT TEXTAREA PROMPT BOX WITH UNCLIPPED DROPDOWNS & MODEL SELECTOR */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-950/5 transition-all relative">
        {/* Auto-growing Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type what your voice agent should say..."
          rows={1}
          maxLength={2000}
          disabled={isLoading}
          className="w-full p-4 text-sm text-zinc-900 placeholder:text-zinc-400 border-none outline-none focus:outline-none focus:ring-0 resize-none bg-transparent min-h-[52px] max-h-[200px] overflow-y-auto rounded-t-2xl"
        />

        {/* Bottom Toolbar inside prompt box */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-50/80 border-t border-zinc-100 rounded-b-2xl gap-2 flex-wrap sm:flex-nowrap">
          {/* Left Hand Side: Model Selector & Character Counter */}
          <div className="flex items-center gap-2">
            {/* Model Selector Dropdown with Full Name display */}
            <div className="w-auto min-w-[120px] max-w-[185px]">
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200">
                  <div className="flex items-center gap-1 truncate">
                    <svg
                      className="w-3.5 h-3.5 text-zinc-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <SelectValue>
                      {MODEL_OPTIONS[selectedModel] || selectedModel}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="min-w-[190px]"
                >
                  <SelectItem value="kokoro">Kokoro 82M</SelectItem>
                  <SelectItem value="elevenlabs" disabled>
                    ElevenLabs (Coming Soon)
                  </SelectItem>
                  <SelectItem value="xtts" disabled>
                    XTTS v2 (Coming Soon)
                  </SelectItem>
                  <SelectItem value="chattts" disabled>
                    ChatTTS (Coming Soon)
                  </SelectItem>
                  <SelectItem value="f5tts" disabled>
                    F5-TTS (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Character Count */}
            <span className="text-[11px] select-none font-mono text-zinc-400 px-1">
              {text.length}/2000
            </span>
          </div>

          {/* Right Hand Side: Icon-Only Dropdowns for Language & Voice + Icon-Only Generate Button */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Language Selector (Icon-Only with Tooltip & Grayish Hover BG) */}
            <div className="relative group">
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  hideChevron
                  className="h-8 w-8 p-0 border-none bg-transparent text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 transition-colors rounded-lg flex items-center justify-center shadow-none"
                >
                  <IconLanguage className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="end"
                  className="min-w-[140px]"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center justify-center px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap pointer-events-none z-30 animate-in fade-in duration-150">
                Language: {currentLangObj?.name || "Language"}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
            </div>

            {/* Voice Selector (Icon-Only with Tooltip & Grayish Hover BG) */}
            <div className="relative group">
              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                disabled={isLoading}
              >
                <SelectTrigger
                  hideChevron
                  className="h-8 w-8 p-0 border-none bg-transparent text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 transition-colors rounded-lg flex items-center justify-center shadow-none"
                >
                  <IconMicrophone className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="end"
                  className="min-w-[185px]"
                >
                  {filteredVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center justify-center px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap pointer-events-none z-30 animate-in fade-in duration-150">
                Voice: {currentVoiceObj?.name || "Voice"}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
            </div>

            {/* Icon-Only Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
              size="icon"
              title="Generate Speech"
              className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
