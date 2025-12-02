"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createNewConversation } from "@/actions/conversations";
import { Message } from "@/components/MessageList";
import { DEFAULT_MODEL_ID, ModelId } from "@/config/models";

export function useChatHandler(
  initialMessages: Message[] = [],
  initialHasMore: boolean = true,
) {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);

  const handleSendMessage = async (
    messageText: string,
    model: ModelId = DEFAULT_MODEL_ID,
  ) => {
    setIsLoading(true);
    setLoadingMessage("Processing your question...");

    // Add user message to the state immediately
    setMessages((msgs) => [
      ...msgs,
      { role: "user", content: messageText, timestamp: new Date() },
    ]);

    try {
      if (!conversationId) {
        await createNewConversation({ query: messageText, model });
        return;
      }
      // Prepare the request
      const formData = new FormData();
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }
      formData.append("query", messageText);
      formData.append("model", model);

      console.log("model", model);

      // Send the request and stream the response
      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "No answer returned");
        throw new Error(errorText || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Optimistically add an empty bot message that we append to
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", content: "", timestamp: new Date() },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((msgs) => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          if (last && last.role === "bot") {
            updated[updated.length - 1] = {
              ...last,
              content: (last.content || "") + chunk,
              timestamp: new Date(),
            };
          }
          return updated;
        });
      }
      setLoadingMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      throw err; // Let the component handle the error
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const loadPreviousMessages = async () => {
    if (!conversationId || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0];
      const res = await fetch(
        `/api/messages?conversationId=${conversationId}&beforeId=${encodeURIComponent(
          oldest.id || "",
        )}&limit=20`,
      );
      const data = await res.json();
      const older: Array<{
        id: string;
        sender: "user" | "assistant";
        message: string;
        created_at: string;
      }> = data?.data || [];
      const pagination = data?.pagination as
        | { totalPages?: number; page?: number }
        | undefined;
      if (pagination && pagination.totalPages && pagination.page) {
        // Hide if we've reached the boundary (page 1) or no further pages exist
        const noMore =
          pagination.page <= 1 || pagination.page >= pagination.totalPages;
        setHasMore(!noMore);
      } else if (older.length === 0) {
        setHasMore(false);
        return;
      }
      const mapped: Message[] = older.map((c) => ({
        id: c.id,
        role: c.sender === "assistant" ? "bot" : "user",
        content: c.message,
        timestamp: new Date(c.created_at),
      }));
      setMessages((prev) => [...mapped, ...prev]);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    messages,
    isLoading,
    loadingMessage,
    handleSendMessage,
    loadPreviousMessages,
    isLoadingMore,
    hasMore,
  };
}
