"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createNewConversation } from "@/actions/conversations";
import { Message } from "@/components/MessageList";

export function useChatHandler(initialMessages: Message[] = []) {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleSendMessage = async (messageText: string, file?: File | null) => {
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
          await createNewConversation({ query: messageText, file });
          return;
        }
        await createNewConversation({ query: messageText });
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

      // Send the request
      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoadingMessage("");

      // Add bot response to messages
      const botMsg =
        data?.data?.assistantMessage || data?.error || "No answer returned";
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", content: botMsg, timestamp: new Date() },
      ]);
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
