import type { ChatsRepository } from "../chat/types";
import type { ConversationsRepository } from "./types";

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

  getById(conversationId: string) {
    return this.conversations.getById(conversationId);
  }

  async updateTitle(userId: string, conversationId: string, title: string) {
    const owns = await this.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) throw new Error("Not found");
    return this.conversations.updateTitle(conversationId, title);
  }
}
