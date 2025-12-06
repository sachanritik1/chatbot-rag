"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageList, Message } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL_ID, type ModelId } from "@/config/models";
import { createEmptyConversation } from "@/actions/conversations";

type ChatPageProps = {
  title?: string;
  prevMessages?: {
    id?: string;
    role: "user" | "bot";
    content: string;
    createdAt?: string;
    model?: string | null;
  }[];
  initialHasMore?: boolean;
};

export default function ChatPage({
  prevMessages,
}: ChatPageProps) {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string | undefined;

  // Get initial model from last message with a valid model
  const lastWithModel = [...(prevMessages || [])]
    .reverse()
    .find(
      (m) =>
        typeof m.model === "string" &&
        (ALLOWED_MODEL_IDS as readonly string[]).includes(m.model as string),
    );
  const initialModel =
    (lastWithModel?.model as ModelId | undefined) || DEFAULT_MODEL_ID;

  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
  });

  // Only convert prevMessages once on mount, then let useChat manage all messages
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize useChat with prevMessages on mount
  if (!isInitialized && prevMessages && prevMessages.length > 0 && messages.length === 0) {
    const initialUIMessages = prevMessages.map((msg) => ({
      id: msg.id || crypto.randomUUID(),
      role: msg.role === "bot" ? ("assistant" as const) : ("user" as const),
      parts: [{ type: "text" as const, text: msg.content }],
      status: "ready" as const,
    }));
    setMessages(initialUIMessages);
    setIsInitialized(true);
  }

  // Convert useChat UIMessages to our Message format for display
  const allMessages: Message[] = messages.map((msg) => {
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
      model: originalMsg?.model || (msg.role === "assistant" ? currentModel : undefined),
    };
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSendMessage = async (text: string, model: ModelId = DEFAULT_MODEL_ID) => {
    setCurrentModel(model);

    // If no conversation exists, create one first
    let targetConvId = conversationId;
    if (!targetConvId) {
      const result = await createEmptyConversation({ title: text.slice(0, 50) });
      if ("error" in result) {
        console.error("Failed to create conversation:", result.error);
        return;
      }
      targetConvId = result.conversationId;
      router.push(`/chat/${targetConvId}`);
    }

    // Send message with custom body data
    sendMessage(
      { text },
      {
        body: {
          conversationId: targetConvId,
          model,
        },
      },
    );
  };

  const handleRetry = async (_messageIndex: number, model: ModelId) => {
    setCurrentModel(model);
    // TODO: Implement retry with useChat
    console.log("Retry not yet implemented with useChat");
  };

  const handleEdit = async (
    _messageIndex: number,
    _content: string,
    model: ModelId,
  ) => {
    setCurrentModel(model);
    // TODO: Implement edit with useChat
    console.log("Edit not yet implemented with useChat");
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
