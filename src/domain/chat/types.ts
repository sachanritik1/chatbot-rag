import type { ChatHistory } from "@/domain/chat/models";

export type SenderRole = "user" | "assistant";

export interface LlmClient {
  stream(prompt: string): Promise<{
    textStream: AsyncIterable<string>;
  }>;
}

export interface ChatsRepository {
  getRecent(
    conversationId: string,
    limit: number,
  ): Promise<{ data: ChatHistory[] } | { data: null }>;
  create(
    conversationId: string,
    message: string,
    sender: SenderRole,
    model?: string | null,
  ): Promise<unknown>;
  countByConversation?(conversationId: string): Promise<number>;
  getOlder?(
    conversationId: string,
    beforeMessageId: string,
    limit: number,
  ): Promise<{
    data: ChatHistory[];
    nextPage: number;
    totalPages: number;
  }>;
}

export interface ConversationsRepository {
  verifyOwnership(userId: string, conversationId: string): Promise<boolean>;
}

export type BuildPromptFn = (args: {
  history: ChatHistory[];
  question: string;
}) => Promise<string>;
