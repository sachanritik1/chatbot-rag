"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageList } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { useChatHandler } from "@/hooks/use-chat-handler";

type ChatPageProps = {
  title?: string;
  prevMessages?: { role: "user" | "bot"; content: string }[];
};

export default function ChatPage({ title, prevMessages }: ChatPageProps) {
  // Convert previous messages to the right format with timestamps
  const initialMessages =
    prevMessages?.map((msg) => ({ ...msg, timestamp: new Date() })) || [];

  // Use our custom hook for chat functionality
  const {
    messages,
    isLoading,
    loadingMessage,
    handleSendMessage,
    loadPreviousMessages,
    isLoadingMore,
    hasMore,
  } = useChatHandler(initialMessages);

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)]">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {title ?? "AI Chat"}
        </CardTitle>
      </CardHeader>

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
