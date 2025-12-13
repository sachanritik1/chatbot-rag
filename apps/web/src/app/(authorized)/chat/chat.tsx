"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Message } from "@/components/MessageList";
import { MessageList } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID } from "@/config/models";
import type { ModelId } from "@/config/models";
import { createEmptyConversation } from "@/actions/conversations";
import { deleteMessagesAfter } from "@/actions/chats";

interface ChatPageProps {
  title?: string;
  prevMessages?: {
    id?: string;
    role: "user" | "bot";
    content: string;
    createdAt?: string;
    model?: string | null;
  }[];
  initialHasMore?: boolean;
  shouldRegenerate?: boolean;
  regenerateModel?: ModelId;
}

export default function ChatPage({
  prevMessages,
  shouldRegenerate,
  regenerateModel,
}: ChatPageProps) {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string | undefined;

  // Get initial model from last message with a valid model
  const lastWithModel = [...(prevMessages ?? [])]
    .reverse()
    .find(
      (m) =>
        typeof m.model === "string" &&
        (ALLOWED_MODEL_IDS as readonly string[]).includes(m.model),
    );
  const initialModel =
    (lastWithModel?.model as ModelId | undefined) ?? DEFAULT_MODEL_ID;

  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
  });

  // Only convert prevMessages once on mount, then let useChat manage all messages
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTriggeredRegenerate, setHasTriggeredRegenerate] = useState(false);

  // Initialize useChat with prevMessages on mount
  if (
    !isInitialized &&
    prevMessages &&
    prevMessages.length > 0 &&
    messages.length === 0
  ) {
    const initialUIMessages = prevMessages.map((msg) => ({
      id: msg.id ?? crypto.randomUUID(),
      role: msg.role === "bot" ? ("assistant" as const) : ("user" as const),
      parts: [{ type: "text" as const, text: msg.content }],
      status: "ready" as const,
    }));
    setMessages(initialUIMessages);
    setIsInitialized(true);
  }

  // Handle regeneration after initialization
  useEffect(() => {
    async function triggerRegeneration(
      text: string,
      conversationId: string,
      model: ModelId,
    ) {
      await sendMessage(
        { text },
        {
          body: {
            conversationId,
            model,
          },
        },
      );
    }

    if (
      isInitialized &&
      !hasTriggeredRegenerate &&
      shouldRegenerate &&
      conversationId &&
      prevMessages &&
      prevMessages.length > 0
    ) {
      const lastUserMsg = [...prevMessages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMsg) {
        const modelToUse = regenerateModel ?? currentModel;
        setCurrentModel(modelToUse);
        setHasTriggeredRegenerate(true);
        triggerRegeneration(lastUserMsg.content, conversationId, modelToUse);
      }
    }
  }, [
    conversationId,
    currentModel,
    hasTriggeredRegenerate,
    isInitialized,
    prevMessages,
    regenerateModel,
    sendMessage,
    shouldRegenerate,
  ]);

  // Convert useChat UIMessages to our Message format for display
  const allMessages = messages.map((msg) => {
    // Extract text from parts array
    const textPart = msg.parts.find((p) => p.type === "text");
    const content = textPart && "text" in textPart ? textPart.text : "";

    // Try to get metadata from original prevMessages for static messages
    const originalMsg = prevMessages?.find((pm) => pm.id === msg.id);

    return {
      id: msg.id,
      role: msg.role === "assistant" ? ("bot" as const) : ("user" as const),
      content,
      timestamp: originalMsg?.createdAt
        ? new Date(originalMsg.createdAt)
        : new Date(),
      model:
        originalMsg?.model ??
        (msg.role === "assistant" ? currentModel : undefined),
    };
  }) as Message[];

  const isLoading = status === "submitted" || status === "streaming";

  const handleSendMessage = async (
    text: string,
    model: ModelId = DEFAULT_MODEL_ID,
  ) => {
    setCurrentModel(model);

    // If no conversation exists, create one first
    let targetConvId = conversationId;
    if (!targetConvId) {
      const result = await createEmptyConversation({
        title: text.slice(0, 50),
      });
      if ("error" in result) {
        console.error("Failed to create conversation:", result.error);
        return;
      }
      targetConvId = result.conversationId;
      router.push(`/chat/${targetConvId}`);
    }

    // Send message with custom body data
    await sendMessage(
      { text },
      {
        body: {
          conversationId: targetConvId,
          model,
        },
      },
    );
  };

  const handleRetry = async (messageIndex: number, model: ModelId) => {
    if (!conversationId) return;

    setCurrentModel(model);

    // Find the last user message before this index
    const userMessages = messages
      .slice(0, messageIndex + 1)
      .filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) return;

    const textPart = lastUserMessage.parts.find((p) => p.type === "text");
    const messageText = textPart && "text" in textPart ? textPart.text : "";

    if (!messageText) return;

    // Get the message before the one we're retrying (to delete everything after it)
    const messageBeforeIndex = messageIndex - 1;
    if (messageBeforeIndex >= 0) {
      const messageBeforeId = allMessages[messageBeforeIndex]?.id;
      if (messageBeforeId) {
        // Delete messages from DB after this point
        await deleteMessagesAfter({
          conversationId,
          messageId: messageBeforeId,
        });
      }
    }

    // Remove all messages after and including the current one from UI
    setMessages(messages.slice(0, messageIndex));

    // Resend the last user message with the new model
    await sendMessage(
      { text: messageText },
      {
        body: {
          conversationId,
          model,
        },
      },
    );
  };

  const handleEdit = async (
    messageIndex: number,
    content: string,
    model: ModelId,
  ) => {
    if (!conversationId) return;

    setCurrentModel(model);

    // Get the message before the one we're editing (to delete everything after it)
    const messageBeforeIndex = messageIndex - 1;
    if (messageBeforeIndex >= 0) {
      const messageBeforeId = allMessages[messageBeforeIndex]?.id;
      if (messageBeforeId) {
        // Delete messages from DB after this point
        await deleteMessagesAfter({
          conversationId,
          messageId: messageBeforeId,
        });
      }
    }

    // Remove all messages after and including the current one from UI
    setMessages(messages.slice(0, messageIndex));

    // Send the edited message
    await sendMessage(
      { text: content },
      {
        body: {
          conversationId,
          model,
        },
      },
    );
  };

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)] pt-0">
      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto border-b-2 px-4 py-6">
        <MessageList
          messages={allMessages}
          isLoading={isLoading}
          loadingMessage=""
          shouldAutoScroll={true}
          conversationId={conversationId}
          onRetry={handleRetry}
          onEdit={handleEdit}
        />
      </CardContent>

      <CardFooter>
        <ChatInputForm
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          initialModel={currentModel}
        />
      </CardFooter>
    </Card>
  );
}
