import type { ConversationsRepository } from "@/domain/conversations/types";
import type { ChatsRepository } from "@/domain/chat/types";

export class ConversationService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly chats: ChatsRepository,
  ) {}

  async create(userId: string, title: string) {
    const created = await this.conversations.create(userId, title);
    if (!created) throw new Error("Create conversation failed");
    return created.id;
  }

  async listForUser(userId: string) {
    return this.conversations.listByUserId(userId);
  }

  async deleteForUser(userId: string, conversationId: string) {
    const owns = await this.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) throw new Error("Not found");
    // Cascade delete chats; documents cascade can be handled by DB or DocumentService if needed
    // Optional: add ChatsRepository.deleteByConversationId here when implemented
    return this.conversations.deleteById(conversationId);
  }

  async verifyOwnership(userId: string, conversationId: string) {
    return this.conversations.verifyOwnership(userId, conversationId);
  }

  async getById(conversationId: string) {
    return this.conversations.getById(conversationId);
  }
}
