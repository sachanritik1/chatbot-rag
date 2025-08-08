"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createNewConversation } from "@/actions/conversations";
import { Message } from "@/components/MessageList";
import { DEFAULT_MODEL_ID, ModelId } from "@/config/models";

export function useChatHandler(initialMessages: Message[] = []) {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleSendMessage = async (
    messageText: string,
    file?: File | null,
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
        if (file) {
          await createNewConversation({ query: messageText, file, model });
          return;
        }
        await createNewConversation({ query: messageText, model });
        return;
      }
      // Prepare the request
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }
      formData.append("query", messageText);
      formData.append("model", model);

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

  return {
    messages,
    isLoading,
    loadingMessage,
    handleSendMessage,
  };
}
