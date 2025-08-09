import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Document } from "@langchain/core/documents";

export class DocumentIndexer {
  constructor(
    private readonly chunkSize: number = 1000,
    private readonly chunkOverlap: number = 200,
  ) {}

  async indexPdfToDocuments(
    file: File,
    conversationId: string,
  ): Promise<Document[]> {
    const loader = new WebPDFLoader(file);
    const pages = await loader.load();
    const enrichedPages = pages.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        conversation_id: conversationId,
      },
    }));

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    const splitDocs = await splitter.splitDocuments(enrichedPages);
    return splitDocs;
  }
}
