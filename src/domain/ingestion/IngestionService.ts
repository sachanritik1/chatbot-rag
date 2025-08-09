import type { Document } from "@langchain/core/documents";
import { DocumentIndexer } from "@/domain/documents/DocumentIndexer";
import { VectorStoreService } from "@/domain/vector/VectorStoreService";

export class IngestionService {
  constructor(
    private readonly indexer: DocumentIndexer,
    private readonly vectorService: VectorStoreService,
  ) {}

  async indexPdfAndAdd(file: File, conversationId: string): Promise<void> {
    const docs: Document[] = await this.indexer.indexPdfToDocuments(
      file,
      conversationId,
    );
    await this.vectorService.addDocuments(docs);
  }
}
