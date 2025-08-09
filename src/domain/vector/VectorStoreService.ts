import type { Document } from "@langchain/core/documents";
import type { VectorStore } from "@/domain/chat/types";

export class VectorStoreService {
  constructor(private readonly store: VectorStore) {}

  async addDocumentsWithConversationMetadata(
    documents: Document[],
    conversationId: string,
  ) {
    const docsWithMeta = documents.map((doc) => ({
      ...doc,
      metadata: {
        ...(doc.metadata || {}),
        conversation_id: conversationId,
      },
    }));
    return this.store.addDocuments(docsWithMeta);
  }

  async searchConversation(
    question: string,
    conversationId: string,
    k: number = 4,
  ) {
    const docs = await this.store.similaritySearch(
      question,
      k,
      (rpc: unknown) =>
        (
          rpc as { filter: (col: string, op: string, val: string) => unknown }
        ).filter("metadata->>conversation_id", "eq", conversationId),
    );
    const fileContext = docs.map((d) => d.pageContent).join("\n---\n") || "";
    return { docs, fileContext } as const;
  }

  async addDocuments(documents: Document[]) {
    return this.store.addDocuments(documents);
  }
}
