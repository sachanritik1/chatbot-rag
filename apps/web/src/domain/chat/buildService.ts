import { ChatService } from "@chatbot-rag/domain/chat";
import {
  SupabaseConversationsRepository,
  SupabaseChatsRepository,
} from "@chatbot-rag/repositories";
import { buildChatPrompt } from "@/lib/prompts";
import { GeminiChatClient } from "@/infrastructure/llm/GeminiChatCleint";
import type { ModelId } from "@/config/models";
import { createClient } from "@/utils/supabase/server";

export async function buildChatService(model?: ModelId) {
  const supabase = await createClient();
  return new ChatService({
    llm: new GeminiChatClient(model),
    chats: new SupabaseChatsRepository(supabase),
    conversations: new SupabaseConversationsRepository(supabase),
    buildPrompt: buildChatPrompt,
  });
}
