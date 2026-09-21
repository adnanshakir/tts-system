"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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

interface ChatInputProps {
  onSend: (text: string, settings: {
    language: Language;
    voice: string;
    model: string;
  }) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const [selectedVoice, setSelectedVoice] = useState<string>("af_bella");
  const [selectedModel, setSelectedModel] = useState<string>("kokoro");
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

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), {
      language: selectedLanguage,
      voice: selectedVoice,
      model: selectedModel,
    });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(
    (l) => l.id === selectedLanguage,
  );
  const currentVoiceObj = KOKORO_VOICES.find((v) => v.id === selectedVoice);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-950/5 transition-all relative">
      {/* Auto-growing Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type what your voice agent should say…"
        rows={1}
        maxLength={2000}
        disabled={disabled}
        className="w-full p-4 text-sm text-zinc-900 placeholder:text-zinc-400 border-none outline-none focus:outline-none focus:ring-0 resize-none bg-transparent min-h-[52px] max-h-[200px] overflow-y-auto rounded-t-2xl"
      />

      {/* Bottom Toolbar inside prompt box */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-50/80 border-t border-zinc-100 rounded-b-2xl gap-2 flex-wrap sm:flex-nowrap">
        {/* Left Hand Side: Model Selector & Character Counter */}
        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="w-auto min-w-[120px] max-w-[185px]">
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={disabled}
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
                side="top"
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

        {/* Right Hand Side: Language & Voice selectors + Send Button */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Language Selector */}
          <div className="relative group">
            <Select
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
              disabled={disabled}
            >
              <SelectTrigger
                hideChevron
                className="h-8 w-8 p-0 border-none bg-transparent text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 transition-colors rounded-lg flex items-center justify-center shadow-none"
              >
                <IconLanguage className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent
                side="top"
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

          {/* Voice Selector */}
          <div className="relative group">
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={disabled}
            >
              <SelectTrigger
                hideChevron
                className="h-8 w-8 p-0 border-none bg-transparent text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 transition-colors rounded-lg flex items-center justify-center shadow-none"
              >
                <IconMicrophone className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent
                side="top"
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

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            size="icon"
            title="Generate Speech"
            className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
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
          </Button>
        </div>
      </div>
    </div>
  );
}
