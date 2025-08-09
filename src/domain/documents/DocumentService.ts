import type { DocumentsRepository } from "@/domain/documents/types";
import { IngestionService } from "@/domain/ingestion/IngestionService";
import { ConversationService } from "@/domain/conversations/ConversationService";

export class DocumentService {
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly ingestion: IngestionService,
    private readonly conversations: ConversationService,
  ) {}

  async listForConversation(userId: string, conversationId: string) {
    const owns = await this.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) throw new Error("Not found");
    return this.documents.listByConversationId(conversationId);
  }

  async addPdf(userId: string, conversationId: string, file: File) {
    const owns = await this.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) throw new Error("Not found");
    await this.ingestion.indexPdfAndAdd(file, conversationId);
  }

  async deleteForConversation(userId: string, conversationId: string) {
    const owns = await this.conversations.verifyOwnership(
      userId,
      conversationId,
    );
    if (!owns) throw new Error("Not found");
    return this.documents.deleteByConversationId(conversationId);
  }
}
