import { useEffect, useRef, useState } from "react";
import { fetch as streamingFetch } from "react-native-fetch-api";

import type { Message, ModelId } from "@chatbot-rag/shared";
import {
  findLastUserMessageBeforeIndex,
  getMessageIdBeforeIndex,
  parseSSETextDeltas,
} from "@chatbot-rag/shared";

import { API_BASE_URL } from "../config/api";
import { branchesApi, messagesApi } from "../lib/api";
import { supabase } from "../lib/supabase";

interface UseChatRNOptions {
  conversationId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
  onBranchCreated?: (
    branchId: string,
    branchData: {
      isUserMessage: boolean;
      modelToUse: string;
      branchMessage?: string;
    },
  ) => void;
}

export function useChatRN({
  conversationId,
  onError,
  onFinish,
  onBranchCreated,
}: UseChatRNOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "streaming">(
    "idle",
  );
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = async (content: string, model: string) => {
    setStatus("loading");

    try {
      // Get auth session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      console.log("📤 Sending message:", {
        conversationId,
        model,
        content: content.slice(0, 50) + "...",
      });

      // Add user message immediately
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const history = [...messagesRef.current, userMsg];

      // Make API request with streaming fetch
      const res = await streamingFetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            parts: [{ type: "text", text: m.content }],
          })),
          conversationId,
          model,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      console.log("✅ Response received, reading...");
      setStatus("streaming");

      // React Native's streaming is unreliable, read full text instead
      const text = await res.text();
      console.log("📄 Got full response:", text.slice(0, 200));

      const assistantMessage = parseSSETextDeltas(text);
      const assistantMsgId = (Date.now() + 1).toString();

      console.log("✅ Parsed message length:", assistantMessage.length);

      if (assistantMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: assistantMessage,
            timestamp: new Date(),
          },
        ]);
      }

      console.log(
        "✅ Message completed. Final length:",
        assistantMessage.length,
      );

      const finalMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
      };

      if (onFinish) {
        onFinish(finalMessage);
      }
    } catch (error: unknown) {
      console.error("❌ Chat error:", error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setStatus("idle");
    }
  };

  const handleRetry = async (messageIndex: number, model: ModelId) => {
    if (!conversationId) return;

    try {
      const messageBeforeId = getMessageIdBeforeIndex(messages, messageIndex);
      if (messageBeforeId) {
        await messagesApi.deleteAfter(conversationId, messageBeforeId);
      }

      // Remove messages from UI after and including the current one
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);

      const userMessage = findLastUserMessageBeforeIndex(
        messages,
        messageIndex,
      );

      if (userMessage) {
        // Resend with new model
        await sendMessage(userMessage.content, model);
      }
    } catch (error) {
      console.error("Error in handleRetry:", error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleEdit = async (
    messageIndex: number,
    newContent: string,
    model: ModelId,
  ) => {
    if (!conversationId) return;

    try {
      const messageBeforeId = getMessageIdBeforeIndex(messages, messageIndex);
      if (messageBeforeId) {
        await messagesApi.deleteAfter(conversationId, messageBeforeId);
      }

      // Remove messages from UI after and including the current one
      setMessages(messages.slice(0, messageIndex));

      // Send the edited message
      await sendMessage(newContent, model);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleBranch = async (messageId: string, model: ModelId) => {
    if (!conversationId) {
      throw new Error("No conversation ID");
    }

    try {
      console.log("🌿 Creating branch:", { conversationId, messageId, model });

      const result = await branchesApi.create(conversationId, messageId, model);

      console.log("✅ Branch created:", result);

      if (onBranchCreated && result.branchId) {
        onBranchCreated(result.branchId, {
          isUserMessage: result.isUserMessage,
          modelToUse: result.modelToUse,
          branchMessage: result.branchMessage,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in handleBranch:", error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  };

  const loadMoreMessages = async () => {
    if (
      !conversationId ||
      isLoadingMore ||
      !hasMoreMessages ||
      messages.length === 0
    )
      return;

    setIsLoadingMore(true);
    try {
      // Get the ID of the oldest message (first in the array)
      const beforeId = messages[0]?.id;
      if (!beforeId) {
        setHasMoreMessages(false);
        return;
      }

      const result = await messagesApi.getPaginated(conversationId, {
        beforeId,
        limit: 20,
      });

      if (result.data.length > 0) {
        // Convert DB messages to display format
        const olderMessages: Message[] = result.data.map((chat) => ({
          id: chat.id ?? "",
          role: chat.sender,
          content: chat.message,
          timestamp: new Date(chat.created_at),
          model: chat.model ?? undefined,
        }));

        // Prepend older messages to the beginning
        setMessages((prev) => [...olderMessages, ...prev]);

        // Check if there are more messages
        // If we got back fewer messages than limit, no more messages
        setHasMoreMessages(result.data.length >= 20);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    messages,
    sendMessage,
    handleRetry,
    handleEdit,
    handleBranch,
    loadMoreMessages,
    status,
    setMessages,
    hasMoreMessages,
    isLoadingMore,
  };
}
