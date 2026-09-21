"use client";

import React from "react";

export default function WelcomeHeader() {
  return (
    <div className="text-center space-y-3 select-none py-16 animate-msg-in">
      {/* Decorative waveform icon */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <div className="flex items-end gap-[2px] h-8 opacity-30">
          {[12, 20, 16, 24, 14, 22, 10, 18, 26, 14, 20, 12].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-zinc-400 rounded-full transition-all"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
        What should your voice agent say?
      </h1>
      <p className="text-sm text-zinc-400 max-w-md mx-auto">
        Type your text below and generate natural-sounding speech instantly.
      </p>
    </div>
  );
}
