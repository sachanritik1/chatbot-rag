"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageList, type Message } from "@/components/MessageList";
import { ChatInputForm } from "@/components/ChatInputForm";
import { useGuestChatHandler } from "@/hooks/use-guest-chat-handler";

export default function GuestChatPage() {
  const { messages, isLoading, loadingMessage, handleSendMessage } =
    useGuestChatHandler();

  return (
    <Card className="size-full max-h-[calc(100%-2.5rem)]">
      <CardContent className="h-full max-h-[calc(100%-2.5rem)] space-y-5 overflow-y-auto px-4 py-6">
        <MessageList
          messages={messages as Message[]}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          shouldAutoScroll
        />
      </CardContent>

      <CardFooter>
        <ChatInputForm
          onSubmit={handleSendMessage}
          isLoading={isLoading}
        />
      </CardFooter>
    </Card>
  );
}
