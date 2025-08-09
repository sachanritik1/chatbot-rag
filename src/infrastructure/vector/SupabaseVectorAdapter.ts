import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { VectorStore } from "@/domain/chat/types";
import type { Document } from "@langchain/core/documents";
import { createClient } from "@/utils/supabase/server";

export class SupabaseVectorAdapter implements VectorStore {
  private storePromise: Promise<SupabaseVectorStore>;

  constructor() {
    this.storePromise = (async () =>
      new SupabaseVectorStore(new OpenAIEmbeddings(), {
        client: await createClient(),
        tableName: "documents",
        queryName: "match_documents",
      }))();
  }

  private async store() {
    return this.storePromise;
  }

  async addDocuments(documents: Array<Document>): Promise<unknown> {
    const s = await this.store();
    const api = s as unknown as {
      addDocuments: (docs: Array<Document>) => Promise<unknown>;
    };
    return api.addDocuments(documents);
  }

  async similaritySearch(
    query: string,
    k: number,
    filter?: (rpc: unknown) => unknown,
  ) {
    const s = await this.store();
    const api = s as unknown as {
      similaritySearch: (
        q: string,
        kk: number,
        f?: (rpc: unknown) => unknown,
      ) => Promise<Array<{ pageContent: string }>>;
    };
    return api.similaritySearch(query, k, filter);
  }
}
