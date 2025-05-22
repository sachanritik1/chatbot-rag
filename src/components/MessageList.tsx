"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { Bot } from "lucide-react";

export type Message = {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  loadingMessage?: string;
}

export function MessageList({
  messages,
  isLoading,
  loadingMessage,
}: MessageListProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
          How can I help you today?
        </h3>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Ask me anything or upload a PDF document to get started with your AI
          assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {loadingMessage && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent" />
          {loadingMessage}
        </div>
      )}

      {messages.map((msg, i) => (
        <ChatMessage
          key={i}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
          isLatest={i === messages.length - 1}
        />
      ))}

      {isLoading && !loadingMessage && (
        <div className="animate-in fade-in-0 flex w-full">
          <div className="flex max-w-[80%] gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 select-none dark:bg-zinc-700">
              <Bot className="h-5 w-5 text-white" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 shadow-sm dark:bg-zinc-800">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                  <div className="animation-delay-200 h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                  <div className="animation-delay-500 h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
