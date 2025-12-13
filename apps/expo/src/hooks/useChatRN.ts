import { useState } from "react";
import { fetch as streamingFetch } from "react-native-fetch-api";

import type { Message } from "@chatbot-rag/shared";

import { API_BASE_URL } from "../config/api";
import { supabase } from "../lib/supabase";

interface UseChatRNOptions {
  conversationId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
}

export function useChatRN({
  conversationId,
  onError,
  onFinish,
}: UseChatRNOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "streaming">(
    "idle",
  );

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

      // Make API request with streaming fetch
      const res = await streamingFetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              parts: [{ type: "text", text: m.content }],
            })),
            {
              role: "user",
              parts: [{ type: "text", text: content }],
            },
          ],
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

      // Parse Server-Sent Events format
      const lines = text.split("\n");
      let assistantMessage = "";
      const assistantMsgId = (Date.now() + 1).toString();

      for (const line of lines) {
        if (!line.trim()) continue;

        // SSE format: "data: {...}"
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          try {
            const parsed = JSON.parse(jsonStr) as {
              type?: string;
              delta?: string;
            };

            // Handle different event types
            if (parsed.type === "text-delta" && parsed.delta) {
              assistantMessage += parsed.delta;
            }
          } catch {
            // Ignore parse errors for non-JSON lines
          }
        }
      }

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

  return { messages, sendMessage, status, setMessages };
}
