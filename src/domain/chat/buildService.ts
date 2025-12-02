import { ChatService } from "@/domain/chat/ChatService";
import { OpenAIChatClient } from "@/infrastructure/llm/OpenAIChatClient";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { buildChatPrompt } from "@/lib/prompts";

export function buildChatService(model?: string | null) {
  return new ChatService({
    llm: new OpenAIChatClient(model),
    chats: new SupabaseChatsRepository(),
    conversations: new SupabaseConversationsRepository(),
    buildPrompt: buildChatPrompt,
  });
}
