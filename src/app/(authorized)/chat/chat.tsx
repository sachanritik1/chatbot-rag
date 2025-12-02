"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageList } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { useChatHandler } from "@/hooks/use-chat-handler";
import { ALLOWED_MODEL_IDS, type ModelId } from "@/config/models";

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
  initialHasMore,
}: ChatPageProps) {
  // Convert previous messages to the right format with timestamps
  const initialMessages =
    prevMessages?.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    })) || [];

  // Use our custom hook for chat functionality
  const {
    messages,
    isLoading,
    loadingMessage,
    handleSendMessage,
    loadPreviousMessages,
    isLoadingMore,
    hasMore,
    conversationId,
  } = useChatHandler(initialMessages, initialHasMore);

  const lastWithModel = [...(prevMessages || [])]
    .reverse()
    .find(
      (m) =>
        typeof m.model === "string" &&
        (ALLOWED_MODEL_IDS as readonly string[]).includes(m.model as string),
    );
  const initialModel =
    (lastWithModel?.model as ModelId | undefined) || undefined;

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)] pt-0">
      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto border-b-2 px-4 py-6">
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline disabled:opacity-60"
              disabled={isLoadingMore}
              onClick={loadPreviousMessages}
            >
              {isLoadingMore ? "Loading…" : "Load previous messages"}
            </button>
          </div>
        )}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          shouldAutoScroll={!isLoadingMore}
          conversationId={conversationId}
        />
      </CardContent>

      <CardFooter>
        <ChatInputForm
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          initialModel={initialModel}
        />
      </CardFooter>
    </Card>
  );
}
