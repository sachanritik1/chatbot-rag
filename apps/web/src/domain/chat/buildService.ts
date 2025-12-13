import { ChatService } from "@/domain/chat/ChatService";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { buildChatPrompt } from "@/lib/prompts";
import { GeminiChatClient } from "@/infrastructure/llm/GeminiChatCleint";
import type { ModelId } from "@/config/models";

export function buildChatService(model?: ModelId) {
  return new ChatService({
    llm: new GeminiChatClient(model),
    chats: new SupabaseChatsRepository(),
    conversations: new SupabaseConversationsRepository(),
    buildPrompt: buildChatPrompt,
  });
}
