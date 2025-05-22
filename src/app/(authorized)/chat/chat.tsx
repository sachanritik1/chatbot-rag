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
  const { messages, isLoading, loadingMessage, handleSendMessage } =
    useChatHandler(initialMessages);

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)]">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-[#23272f]/60">
        <CardTitle className="flex w-full items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            {title ?? "AI Chat"}
          </h1>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto px-4 py-6">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        />
      </CardContent>

      <CardFooter className="flex w-full border-t border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-[#23272f]/60">
        <ChatInputForm onSubmit={handleSendMessage} isLoading={isLoading} />
      </CardFooter>
    </Card>
  );
}
