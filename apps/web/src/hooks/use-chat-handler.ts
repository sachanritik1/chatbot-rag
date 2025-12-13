"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createEmptyConversation } from "@/actions/conversations";
import type { Message } from "@/components/MessageList";
import type { ModelId } from "@/config/models";
import { DEFAULT_MODEL_ID } from "@/config/models";

// Helper: Convert API message to UI message
function toUIMessage(msg: {
  id: string;
  sender: "user" | "assistant";
  message: string;
  created_at: string;
  model?: ModelId;
}): Message {
  return {
    id: msg.id,
    role: msg.sender === "assistant" ? "bot" : "user",
    content: msg.message,
    timestamp: new Date(msg.created_at),
    model: msg.model,
  };
}

export function useChatHandler(
  initialMessages: Message[] = [],
  initialHasMore = true,
  initialModel?: ModelId,
) {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [currentModel, setCurrentModel] = useState<ModelId>(
    initialModel ?? DEFAULT_MODEL_ID,
  );

  // Handle first message or regenerate from URL params
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const firstMessage = urlParams.get("firstMessage");
    const regenerate = urlParams.get("regenerate");
    const modelParam = urlParams.get("model") as ModelId | null | undefined;

    if (conversationId && firstMessage && messages.length === 0) {
      window.history.replaceState({}, "", `/chat/${conversationId}`);
      const model = modelParam ?? DEFAULT_MODEL_ID;
      void handleSendMessage(firstMessage, model);
    } else if (conversationId && regenerate === "true" && messages.length > 0) {
      window.history.replaceState({}, "", `/chat/${conversationId}`);
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        const model = modelParam ?? DEFAULT_MODEL_ID;
        void handleSendMessage(lastUserMessage.content, model);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  // Send message
  const handleSendMessage = async (
    messageText: string,
    model: ModelId = DEFAULT_MODEL_ID,
  ) => {
    const validModel = model;

    // Create conversation if needed
    if (!conversationId) {
      setLoadingMessage("Creating conversation...");

      const titleResponse = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: messageText }),
      });

      let title = "New Conversation";
      if (titleResponse.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await titleResponse.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        title = data.title ?? title;
      }

      const result = await createEmptyConversation({ title });
      if (result.error ?? !result.conversationId) {
        console.error("Error creating conversation:", result.error);
        setLoadingMessage("");
        return;
      }

      router.push(
        `/chat/${result.conversationId}?firstMessage=${encodeURIComponent(messageText)}&model=${validModel}`,
      );
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Processing your question...");

    // Add user message (no ID - will get it on page refresh)
    setMessages((msgs) => [
      ...msgs,
      { role: "user", content: messageText, timestamp: new Date() },
    ]);

    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("query", messageText);
      formData.append("model", validModel);

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.body) {
        throw new Error(await res.text().catch(() => "Request failed"));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Add empty bot message (no ID - will get it on page refresh)
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", content: "", timestamp: new Date(), model: validModel },
      ]);

      // Stream response
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((msgs) => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          if (last?.role === "bot") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }

      setLoadingMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Load previous messages (pagination)
  const loadPreviousMessages = async () => {
    if (!conversationId || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldest = messages[0];
      const res = await fetch(
        `/api/messages?conversationId=${conversationId}&beforeId=${encodeURIComponent(oldest?.id ?? "")}&limit=20`,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const older = (data?.data ?? []).map(toUIMessage);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const pagination = data?.pagination;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (pagination?.totalPages && pagination?.page) {
        const noMore =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          pagination.page <= 1 || pagination.page >= pagination.totalPages;
        setHasMore(!noMore);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (older.length === 0) {
        setHasMore(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
      setMessages((prev) => [...older, ...prev]);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Retry message
  const handleRetry = async (messageIndex: number, model: ModelId) => {
    const message = messages[messageIndex];
    if (!message) return;

    setCurrentModel(model);

    if (message.role === "user") {
      setMessages((msgs) => msgs.slice(0, messageIndex + 1));
      await handleSendMessage(message.content, model);
    } else {
      const userMessage = messages[messageIndex - 1];
      if (userMessage?.role !== "user") return;
      setMessages((msgs) => msgs.slice(0, messageIndex - 1));
      await handleSendMessage(userMessage.content, model);
    }
  };

  // Edit message
  const handleEdit = async (
    messageIndex: number,
    newContent: string,
    model: ModelId,
  ) => {
    const messageToEdit = messages[messageIndex];
    if (messageToEdit?.role !== "user") return;

    setCurrentModel(model);
    setMessages((msgs) => msgs.slice(0, messageIndex));
    await handleSendMessage(newContent, model);
  };

  return {
    messages,
    isLoading,
    loadingMessage,
    handleSendMessage,
    loadPreviousMessages,
    isLoadingMore,
    hasMore,
    conversationId,
    handleRetry,
    handleEdit,
    currentModel,
    setCurrentModel,
  };
}
