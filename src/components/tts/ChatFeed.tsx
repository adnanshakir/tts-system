"use client";

import React, { useRef, useEffect } from "react";
import ChatMessage, { type ChatMessageData } from "./ChatMessage";

interface ChatFeedProps {
  messages: ChatMessageData[];
  onRetry?: (messageId: string) => void;
}

export default function ChatFeed({ messages, onRetry }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto scroll-fade px-1 space-y-4 pb-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onRetry={onRetry} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
