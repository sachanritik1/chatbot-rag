"use client";

import { useRef, useLayoutEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { Bot } from "lucide-react";

export type Message = {
  id?: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  model?: string | null;
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  loadingMessage?: string;
  shouldAutoScroll?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  loadingMessage,
  shouldAutoScroll = true,
}: MessageListProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef<number>(0);
  const prevFirstIdRef = useRef<string | undefined>(undefined);
  const prevLastIdRef = useRef<string | undefined>(undefined);
  const prevLastContentLenRef = useRef<number>(0);

  // Track scroll container and its previous height for preserving position on prepend
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const hasInitializedScrollRef = useRef<boolean>(false);

  function findNearestScrollContainer(): HTMLElement | null {
    let node: HTMLElement | null = chatEndRef.current as HTMLElement | null;
    while (node && node.parentElement) {
      node = node.parentElement as HTMLElement;
      const style = window.getComputedStyle(node);
      const isScrollableY =
        style.overflowY === "auto" || style.overflowY === "scroll";
      const canScroll = node.scrollHeight > node.clientHeight;
      if (isScrollableY || canScroll) {
        return node;
      }
    }
    return null;
  }

  function scrollToBottomInstant(container: HTMLElement | null) {
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }

  // Initialize scroll container reference and baseline height
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) {
      scrollContainerRef.current = findNearestScrollContainer();
    }
    const container = scrollContainerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
    }

    // On first mount, ensure we are at the bottom after layout
    if (!hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      const rafId = requestAnimationFrame(() => {
        // Prefer bottom on first mount regardless of initial message count
        scrollToBottomInstant(
          scrollContainerRef.current || findNearestScrollContainer(),
        );
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, []);

  useLayoutEffect(() => {
    const firstId = messages[0]?.id;
    const last = messages[messages.length - 1];
    const lastId = last?.id;
    const lastContentLen = (last?.content?.length ?? 0) as number;

    const hasAppendedByIdChange =
      lastId !== undefined &&
      prevLastIdRef.current !== undefined &&
      lastId !== prevLastIdRef.current;

    const hasPrepended =
      firstId !== undefined &&
      prevFirstIdRef.current !== undefined &&
      firstId !== prevFirstIdRef.current &&
      messages.length > prevLenRef.current;

    const streamingUpdateToLast =
      messages.length === prevLenRef.current &&
      lastContentLen > prevLastContentLenRef.current;

    // Detect append even when last message has no id (e.g., local user message)
    const hasAppendedByLength =
      messages.length > prevLenRef.current && !hasPrepended;

    const shouldScrollForAppend = hasAppendedByIdChange || hasAppendedByLength;

    const container =
      scrollContainerRef.current || findNearestScrollContainer();
    if (container && !scrollContainerRef.current) {
      scrollContainerRef.current = container;
    }

    // When messages appear initially, jump to bottom
    if (
      container &&
      prevLenRef.current === 0 &&
      messages.length > 0 &&
      shouldAutoScroll
    ) {
      scrollToBottomInstant(container);
    }

    if (container) {
      // Preserve position when older messages are prepended
      if (hasPrepended) {
        const prevHeight =
          prevScrollHeightRef.current || container.scrollHeight;
        const newHeight = container.scrollHeight;
        const delta = newHeight - prevHeight;
        if (delta > 0) {
          container.scrollTop += delta;
        }
      } else if (
        shouldAutoScroll &&
        (shouldScrollForAppend || streamingUpdateToLast)
      ) {
        // Scroll to bottom on append (by id or length) or streaming updates
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      // Update previous height after handling
      prevScrollHeightRef.current = container.scrollHeight;
    } else if (
      shouldAutoScroll &&
      (shouldScrollForAppend || streamingUpdateToLast)
    ) {
      // Fallback if container not yet found
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // update refs after decision
    prevLenRef.current = messages.length;
    prevFirstIdRef.current = firstId;
    prevLastIdRef.current = lastId;
    prevLastContentLenRef.current = lastContentLen;
  }, [messages, shouldAutoScroll]);

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
          Ask me anything to get started with your AI assistant.
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
