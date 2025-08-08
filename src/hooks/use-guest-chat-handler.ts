"use client";

import { useState } from "react";
import { Message } from "@/components/MessageList";
import { DEFAULT_MODEL_ID, type ModelId } from "@/config/models";

export function useGuestChatHandler() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleSendMessage = async (
    messageText: string,
    file?: File | null,
    model: ModelId = DEFAULT_MODEL_ID,
  ) => {
    setIsLoading(true);
    setLoadingMessage("Processing your question...");

    setMessages((msgs) => [
      ...msgs,
      { role: "user", content: messageText, timestamp: new Date() },
    ]);

    try {
      const formData = new FormData();
      formData.append("query", messageText);
      formData.append("model", model);
      // file uploads are not supported in guest flow

      const res = await fetch("/api/guest-chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "No answer returned");
        throw new Error(errorText || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

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
      console.error("Error sending guest message:", err);
      const message = (err as { message?: string }).message || "Request failed";
      setMessages((msgs) => [
        ...msgs,
        {
          role: "bot",
          content: `Error: ${message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return { messages, isLoading, loadingMessage, handleSendMessage };
}
