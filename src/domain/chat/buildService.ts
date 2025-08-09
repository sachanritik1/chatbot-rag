import { ChatService } from "@/domain/chat/ChatService";
import { OpenAIChatClient } from "@/infrastructure/llm/OpenAIChatClient";
import { SupabaseVectorAdapter } from "@/infrastructure/vector/SupabaseVectorAdapter";
import { SupabaseConversationsRepository } from "@/infrastructure/repos/ConversationsRepository";
import { SupabaseChatsRepository } from "@/infrastructure/repos/ChatsRepository";
import { buildChatPrompt } from "@/lib/prompts";
import { VectorStoreService } from "@/domain/vector/VectorStoreService";
import { IngestionService } from "@/domain/ingestion/IngestionService";
import { DocumentIndexer } from "@/domain/documents/DocumentIndexer";

export function buildChatService(model?: string | null) {
  const vectorAdapter = new SupabaseVectorAdapter();
  const vectorService = new VectorStoreService(vectorAdapter);
  const ingestionService = new IngestionService(
    new DocumentIndexer(),
    vectorService,
  );
  return new ChatService({
    llm: new OpenAIChatClient(model),
    vectorService,
    chats: new SupabaseChatsRepository(),
    conversations: new SupabaseConversationsRepository(),
    buildPrompt: buildChatPrompt,
    ingestionService,
  });
}
