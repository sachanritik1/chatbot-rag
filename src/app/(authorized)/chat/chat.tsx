"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageList } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { useChatHandler } from "@/hooks/use-chat-handler";

type ChatPageProps = {
  title?: string;
  prevMessages?: {
    id?: string;
    role: "user" | "bot";
    content: string;
    createdAt?: string;
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
  } = useChatHandler(initialMessages, initialHasMore);

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)]">
      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto px-4 py-6">
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
        />
      </CardContent>

      <CardFooter>
        <ChatInputForm onSubmit={handleSendMessage} isLoading={isLoading} />
      </CardFooter>
    </Card>
  );
}
